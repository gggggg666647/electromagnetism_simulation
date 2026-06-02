/**
 * 模块1: 带电粒子在复合电磁场中的偏转
 * 功能: 实时数值求解运动微分方程，Canvas绘制粒子运动轨迹
 * 作者: AI辅助编程
 */

class ParticleDeflection {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.isRunning = false;
        this.trails = [];
        this.maxTrails = 5;
        
        // 物理参数
        this.params = {
            E: 50,           // 电场强度 N/C
            B: 2,            // 磁感应强度 T
            v: 50,           // 初速度 m/s
            m: 10,           // 质量 ×10^-27 kg
            charge: 1,       // 电荷 +1 或 -1
            mode: 'electric' // electric, magnetic, compound
        };
        
        // 粒子状态
        this.particles = [];
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupControls();
        this.resetParticles();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.draw();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight || 700;
        this.scale = Math.min(this.canvas.width, this.canvas.height) / 400;
        if (!this.isRunning) this.draw();
    }
    
    setupControls() {
        // 模式切换
        document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn[data-mode]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.params.mode = btn.dataset.mode;
                this.updateModeLabel();
                this.resetParticles();
            });
        });
        
        // 电场强度滑块
        const eField = document.getElementById('eField');
        const eFieldValue = document.getElementById('eFieldValue');
        eField.addEventListener('input', () => {
            this.params.E = parseFloat(eField.value);
            eFieldValue.textContent = this.params.E;
        });
        
        // 磁感应强度滑块
        const bField = document.getElementById('bField');
        const bFieldValue = document.getElementById('bFieldValue');
        bField.addEventListener('input', () => {
            this.params.B = parseFloat(bField.value);
            bFieldValue.textContent = this.params.B.toFixed(1);
        });
        
        // 初速度滑块
        const velocity = document.getElementById('velocity');
        const velocityValue = document.getElementById('velocityValue');
        velocity.addEventListener('input', () => {
            this.params.v = parseFloat(velocity.value);
            velocityValue.textContent = this.params.v;
        });
        
        // 质量滑块
        const mass = document.getElementById('mass');
        const massValue = document.getElementById('massValue');
        mass.addEventListener('input', () => {
            this.params.m = parseFloat(mass.value);
            massValue.textContent = this.params.m;
        });
        
        // 电荷单选
        document.querySelectorAll('input[name="charge"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.params.charge = radio.value === 'positive' ? 1 : -1;
            });
        });
        
        // 按钮控制
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearTrails());
    }
    
    updateModeLabel() {
        const labels = {
            'electric': '纯电场偏转模式',
            'magnetic': '纯磁场圆周运动模式',
            'compound': '正交电磁复合场/速度选择器模式'
        };
        document.getElementById('modeLabel').textContent = labels[this.params.mode];
    }
    
    resetParticles() {
        const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff'];
        
        this.particles = [{
            x: this.canvas.width * 0.15,
            y: this.canvas.height / 2,
            vx: this.params.v * this.scale * 0.5,
            vy: 0,
            ax: 0,
            ay: 0,
            trail: [],
            color: colors[0]
        }];
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }
    
    pause() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    reset() {
        this.pause();
        this.resetParticles();
        this.draw();
        this.updateInfoDisplay();
    }
    
    clearTrails() {
        this.particles.forEach(p => p.trail = []);
        this.draw();
    }
    
    calculateForces(particle) {
        const q = this.params.charge * 1.6; // 简化的电荷量
        const m = this.params.m;
        
        let ax = 0, ay = 0;
        
        // 根据模式计算加速度
        switch (this.params.mode) {
            case 'electric':
                // 纯电场: F = qE, 方向垂直向上/下
                ay = q * this.params.E / m;
                break;
                
            case 'magnetic':
                // 纯磁场: 洛伦兹力 F = qvB, 方向垂直于速度
                const vMag = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                if (vMag > 0) {
                    // 洛伦兹力: a = (q/m)(v × B)
                    // B 垂直纸面向里，使用左手定则
                    ax = (q / m) * particle.vy * this.params.B;
                    ay = -(q / m) * particle.vx * this.params.B;
                }
                break;
                
            case 'compound':
                // 复合场: 电场力 + 洛伦兹力
                // 电场: 竖直方向, 磁场: 垂直纸面
                const vMag2 = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                ay = q * this.params.E / m; // 电场力
                if (vMag2 > 0) {
                    ax += (q / m) * particle.vy * this.params.B;
                    ay += -(q / m) * particle.vx * this.params.B;
                }
                break;
        }
        
        return { ax, ay };
    }
    
    updatePhysics(dt = 0.016) {
        this.particles.forEach(particle => {
            // 计算受力
            const forces = this.calculateForces(particle);
            particle.ax = forces.ax;
            particle.ay = forces.ay;
            
            // Verlet积分更新位置
            particle.vx += particle.ax * dt * 50;
            particle.vy += particle.ay * dt * 50;
            particle.x += particle.vx * dt * 50;
            particle.y += particle.vy * dt * 50;
            
            // 保存轨迹
            particle.trail.push({ x: particle.x, y: particle.y });
            if (particle.trail.length > 500) {
                particle.trail.shift();
            }
            
            // 边界检测
            if (particle.x < 0 || particle.x > this.canvas.width ||
                particle.y < 0 || particle.y > this.canvas.height) {
                // 重置到起点
                particle.x = this.canvas.width * 0.15;
                particle.y = this.canvas.height / 2;
                particle.vx = this.params.v * this.scale * 0.5;
                particle.vy = 0;
                particle.trail = [];
            }
        });
        
        this.updateInfoDisplay();
    }
    
    updateInfoDisplay() {
        if (this.particles.length > 0) {
            const p = this.particles[0];
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy) / this.scale * 2;
            const accel = Math.sqrt(p.ax * p.ax + p.ay * p.ay);
            
            document.getElementById('positionDisplay').textContent = 
                `(${Math.round(p.x)}, ${Math.round(p.y)})`;
            document.getElementById('speedDisplay').textContent = speed.toFixed(1);
            document.getElementById('accelDisplay').textContent = accel.toFixed(2);
        }
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制场区域
        this.drawFieldRegion();
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制粒子和轨迹
        this.particles.forEach(particle => {
            this.drawTrail(particle);
            this.drawParticle(particle);
        });
        
        // 绘制场强指示器
        this.drawFieldIndicators();
    }
    
    drawFieldRegion() {
        const margin = 50;
        const regionX = this.canvas.width * 0.2;
        const regionWidth = this.canvas.width * 0.7;
        
        this.ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.strokeRect(regionX, margin, regionWidth, this.canvas.height - margin * 2);
        this.ctx.setLineDash([]);
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 40;
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawTrail(particle) {
        if (particle.trail.length < 2) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        
        for (let i = 1; i < particle.trail.length; i++) {
            this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
        }
        
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.6;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }
    
    drawParticle(particle) {
        // 绘制粒子光晕
        const gradient = this.ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, 20
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制粒子核心
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制电荷符号
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.params.charge > 0 ? '+' : '−', particle.x, particle.y);
        
        // 绘制速度箭头
        this.drawVelocityArrow(particle);
    }
    
    drawVelocityArrow(particle) {
        const arrowLength = 30;
        const angle = Math.atan2(particle.vy, particle.vx);
        
        const endX = particle.x + Math.cos(angle) * arrowLength;
        const endY = particle.y + Math.sin(angle) * arrowLength;
        
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(particle.x, particle.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // 箭头头部
        const headLength = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }
    
    drawFieldIndicators() {
        const regionX = this.canvas.width * 0.2;
        const regionWidth = this.canvas.width * 0.7;
        const centerY = this.canvas.height / 2;
        
        // 电场线（竖直方向）
        if (this.params.mode === 'electric' || this.params.mode === 'compound') {
            const eIntensity = Math.min(this.params.E / 100, 1);
            this.ctx.strokeStyle = `rgba(255, 100, 100, ${0.3 + eIntensity * 0.4})`;
            this.ctx.lineWidth = 1;
            
            const lineSpacing = Math.max(20, 60 - this.params.E * 0.4);
            
            for (let x = regionX + 30; x < regionX + regionWidth - 30; x += lineSpacing) {
                // 绘制电场线箭头（正电荷受力方向）
                const direction = this.params.charge > 0 ? 1 : -1;
                this.drawFieldLine(x, centerY - 100, x, centerY + 100, '#ff6666', direction);
            }
            
            // 标注电场
            this.ctx.fillStyle = '#ff6666';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(`E = ${this.params.E} N/C`, regionX + 10, 30);
        }
        
        // 磁场（垂直纸面，用点/叉表示）
        if (this.params.mode === 'magnetic' || this.params.mode === 'compound') {
            const bIntensity = Math.min(this.params.B / 5, 1);
            const dotSpacing = Math.max(30, 80 - this.params.B * 10);
            
            for (let x = regionX + 50; x < regionX + regionWidth - 50; x += dotSpacing) {
                for (let y = 80; y < this.canvas.height - 80; y += dotSpacing) {
                    // B垂直纸面向里用×，向外用·
                    this.ctx.fillStyle = `rgba(100, 200, 255, ${0.4 + bIntensity * 0.4})`;
                    this.ctx.font = 'bold 16px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('×', x, y);
                }
            }
            
            // 标注磁场
            this.ctx.fillStyle = '#64c8ff';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(`B = ${this.params.B} T (⊗)`, regionX + 10, 55);
        }
    }
    
    drawFieldLine(x1, y1, x2, y2, color, direction) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        // 绘制箭头
        const midY = (y1 + y2) / 2;
        const arrowSize = 6;
        this.ctx.beginPath();
        if (direction > 0) {
            this.ctx.moveTo(x1, midY + arrowSize);
            this.ctx.lineTo(x1 - arrowSize, midY);
            this.ctx.lineTo(x1 + arrowSize, midY);
        } else {
            this.ctx.moveTo(x1, midY - arrowSize);
            this.ctx.lineTo(x1 - arrowSize, midY);
            this.ctx.lineTo(x1 + arrowSize, midY);
        }
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.updatePhysics();
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new ParticleDeflection();
});