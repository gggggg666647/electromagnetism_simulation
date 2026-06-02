/**
 * 模块3: 通电螺线管空间磁感线可视化
 * 功能: Canvas2D绘制截面磁感线分布图，鼠标悬停显示磁感应强度
 * 作者: AI辅助编程
 */

class SolenoidVisualization {
    constructor() {
        this.canvas = document.getElementById('solenoidCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 物理常数
        this.mu0 = 4 * Math.PI * 1e-7; // 真空磁导率
        
        // 物理参数
        this.params = {
            N: 100,         // 匝数
            I: 2,           // 电流 A
            L: 20,          // 长度 cm
            R: 3,           // 半径 cm
            lineCount: 15,  // 磁感线条数
            precision: 'medium' // low, medium, high
        };
        
        // 动画状态
        this.isAnimating = false;
        this.animationFrame = 0;
        this.mousePos = null;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupControls();
        this.setupMouse();
        this.calculateValues();
        this.draw();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight || 700;
    }
    
    setupControls() {
        // 匝数
        const turns = document.getElementById('turns');
        const turnsValue = document.getElementById('turnsValue');
        turns.addEventListener('input', () => {
            this.params.N = parseInt(turns.value);
            turnsValue.textContent = this.params.N;
            this.updateCalculation();
        });
        
        // 电流
        const current = document.getElementById('current');
        const currentValue = document.getElementById('currentValue');
        current.addEventListener('input', () => {
            this.params.I = parseFloat(current.value);
            currentValue.textContent = this.params.I.toFixed(1);
            this.updateCalculation();
        });
        
        // 长度
        const length = document.getElementById('length');
        const lengthValue = document.getElementById('lengthValue');
        length.addEventListener('input', () => {
            this.params.L = parseFloat(length.value);
            lengthValue.textContent = this.params.L;
            this.updateCalculation();
        });
        
        // 半径
        const radius = document.getElementById('radius');
        const radiusValue = document.getElementById('radiusValue');
        radius.addEventListener('input', () => {
            this.params.R = parseFloat(radius.value);
            radiusValue.textContent = this.params.R;
            this.updateCalculation();
        });
        
        // 磁感线条数
        const lineCount = document.getElementById('lineCount');
        const lineCountValue = document.getElementById('lineCountValue');
        lineCount.addEventListener('input', () => {
            this.params.lineCount = parseInt(lineCount.value);
            lineCountValue.textContent = this.params.lineCount;
            this.draw();
        });
        
        // 精度选择
        document.querySelectorAll('input[name="precision"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.params.precision = radio.value;
                this.draw();
            });
        });
        
        // 按钮
        document.getElementById('solResetBtn').addEventListener('click', () => this.reset());
        document.getElementById('animateBtn').addEventListener('click', () => this.toggleAnimation());
    }
    
    setupMouse() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            this.updateMouseB();
            this.draw();
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.mousePos = null;
            document.getElementById('mouseB').textContent = '--';
            document.getElementById('mousePos').textContent = '--';
            this.draw();
        });
    }
    
    reset() {
        document.getElementById('turns').value = 100;
        document.getElementById('turnsValue').textContent = '100';
        document.getElementById('current').value = 2;
        document.getElementById('currentValue').textContent = '2.0';
        document.getElementById('length').value = 20;
        document.getElementById('lengthValue').textContent = '20';
        document.getElementById('radius').value = 3;
        document.getElementById('radiusValue').textContent = '3';
        document.getElementById('lineCount').value = 15;
        document.getElementById('lineCountValue').textContent = '15';
        
        this.params.N = 100;
        this.params.I = 2;
        this.params.L = 20;
        this.params.R = 3;
        this.params.lineCount = 15;
        
        this.calculateValues();
        this.draw();
    }
    
    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const btn = document.getElementById('animateBtn');
        btn.textContent = this.isAnimating ? '⏸ 停止动画' : '▶ 磁场动画';
        
        if (this.isAnimating) {
            this.animate();
        }
    }
    
    updateCalculation() {
        this.calculateValues();
        this.draw();
    }
    
    calculateValues() {
        // 单位转换
        const L = this.params.L * 0.01;  // cm -> m
        const n = this.params.N / L;      // 匝数密度
        
        // 轴线中心处磁场 B = μ0nI
        const centerB = this.mu0 * n * this.params.I;
        
        // 轴线端点处磁场 B = ½μ0nI (近似)
        const endB = centerB * 0.5;
        
        document.getElementById('centerB').textContent = (centerB * 1000).toFixed(2); // T -> mT
        document.getElementById('endB').textContent = (endB * 1000).toFixed(2);
        document.getElementById('turnDensity').textContent = Math.round(n);
    }
    
    updateMouseB() {
        if (!this.mousePos) return;
        
        const { x, y } = this.mousePos;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 转换为物理坐标 (cm)
        const scale = Math.min(this.canvas.width, this.canvas.height) / (this.params.L * 3);
        const px = (x - centerX) / scale;
        const py = (y - centerY) / scale;
        
        // 计算该点的磁感应强度 (简化模型)
        const B = this.calculateBAtPoint(px, py);
        
        document.getElementById('mouseB').textContent = (B * 1000).toFixed(3);
        document.getElementById('mousePos').textContent = `(${px.toFixed(1)}, ${py.toFixed(1)}) cm`;
    }
    
    calculateBAtPoint(px, py) {
        // 使用毕奥-萨伐尔定律简化计算
        // 相对于螺线管的坐标: x轴沿螺线管轴线, y轴垂直轴线
        const L = this.params.L;
        const R = this.params.R;
        
        // 转换到螺线管局部坐标系
        const x = px;  // 沿轴线方向
        const r = Math.abs(py);  // 到轴线的垂直距离
        
        // 匝数密度
        const n = this.params.N / (L * 0.01); // 匝/m
        
        // 判断点是否在螺线管内部
        const halfL = L / 2;
        
        if (Math.abs(x) <= halfL && r <= R) {
            // 内部: B ≈ μ0nI
            return this.mu0 * n * this.params.I;
        } else {
            // 外部: B随距离衰减
            const distToAxis = Math.max(0, r - R);
            const distToEnd = Math.max(0, Math.abs(x) - halfL);
            const decay = 1 / (1 + (distToAxis + distToEnd) * 0.5);
            return this.mu0 * n * this.params.I * Math.max(0.01, decay);
        }
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景网格
        this.drawGrid();
        
        // 绘制坐标轴线
        this.drawAxes();
        
        // 绘制螺线管
        this.drawSolenoid();
        
        // 绘制磁感线
        this.drawMagneticFieldLines();
        
        // 绘制鼠标指示器
        this.drawMouseIndicator();
        
        // 绘制磁场强度热图
        this.drawHeatMap();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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
    
    drawAxes() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 主轴线（x轴）
        this.ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(this.canvas.width, centerY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // 标注
        this.ctx.fillStyle = 'rgba(0, 217, 255, 0.5)';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('轴线 (x)', this.canvas.width - 50, centerY - 10);
    }
    
    drawSolenoid() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 绘制尺寸缩放
        const scale = Math.min(this.canvas.width, this.canvas.height) / (this.params.L * 3);
        const L_px = this.params.L * scale;
        const R_px = this.params.R * scale;
        
        const left = centerX - L_px / 2;
        const right = centerX + L_px / 2;
        const top = centerY - R_px;
        const bottom = centerY + R_px;
        
        // 绘制螺线管线圈
        this.ctx.strokeStyle = '#4488ff';
        this.ctx.lineWidth = 3;
        
        const turnsToDraw = Math.min(this.params.N / 5, 30);
        const turnSpacing = L_px / turnsToDraw;
        
        // 上边缘线圈
        this.ctx.beginPath();
        for (let i = 0; i <= turnsToDraw; i++) {
            const x = left + i * turnSpacing;
            if (i === 0) {
                this.ctx.moveTo(x, top);
            } else {
                this.ctx.lineTo(x, top);
            }
            
            // 绘制绕线效果
            if (i < turnsToDraw) {
                const midX = x + turnSpacing / 2;
                this.ctx.quadraticCurveTo(midX, top - 8, x + turnSpacing, top);
            }
        }
        this.ctx.stroke();
        
        // 下边缘线圈
        this.ctx.beginPath();
        for (let i = 0; i <= turnsToDraw; i++) {
            const x = left + i * turnSpacing;
            if (i === 0) {
                this.ctx.moveTo(x, bottom);
            } else {
                this.ctx.lineTo(x, bottom);
            }
            
            // 绘制绕线效果
            if (i < turnsToDraw) {
                const midX = x + turnSpacing / 2;
                this.ctx.quadraticCurveTo(midX, bottom + 8, x + turnSpacing, bottom);
            }
        }
        this.ctx.stroke();
        
        // 绘制端盖（垂直部分）
        this.ctx.fillStyle = 'rgba(68, 136, 255, 0.3)';
        this.ctx.fillRect(left - 5, top, 10, R_px * 2);
        this.ctx.fillRect(right - 5, top, 10, R_px * 2);
        
        // 绘制电流方向（点和叉）
        const currentMarkSpacing = L_px / 8;
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let x = left + currentMarkSpacing; x < right; x += currentMarkSpacing * 2) {
            // 上边缘: 电流向外 (·)
            this.ctx.fillStyle = '#00ff88';
            this.ctx.fillText('·', x, top - 15);
            
            // 下边缘: 电流向里 (×)
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillText('×', x, bottom + 15);
        }
        
        // 标注尺寸
        this.ctx.fillStyle = '#00d9ff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`L = ${this.params.L} cm`, centerX, top - 35);
        this.ctx.fillText(`R = ${this.params.R} cm`, right + 40, centerY);
        
        // 标注N极S极
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillText('N', left - 30, centerY);
        this.ctx.fillStyle = '#4488ff';
        this.ctx.fillText('S', right + 30, centerY);
        
        // 保存绘制参数
        this.drawingParams = {
            centerX,
            centerY,
            scale,
            L_px,
            R_px,
            left,
            right,
            top,
            bottom
        };
    }
    
    drawMagneticFieldLines() {
        if (!this.drawingParams) return;
        
        const { centerX, centerY, scale, L_px, R_px, left, right } = this.drawingParams;
        
        // 精度参数
        const steps = this.params.precision === 'low' ? 50 : 
                      this.params.precision === 'medium' ? 100 : 200;
        
        const L_cm = this.params.L;
        const R_cm = this.params.R;
        
        // 起始点分布（螺线管端面附近）
        const startPoints = [];
        const nLines = this.params.lineCount;
        
        for (let i = 0; i < nLines; i++) {
            const ratio = (i + 0.5) / nLines;
            const r = R_cm * ratio * 0.9; // 从轴线到半径分布
            startPoints.push({ x: -L_cm / 2, y: r });
            if (r > 0.1) {
                startPoints.push({ x: -L_cm / 2, y: -r });
            }
        }
        
        // 动画相位
        const phase = this.isAnimating ? Math.sin(this.animationFrame * 0.05) : 0;
        
        // 绘制每条磁感线
        startPoints.forEach((point, idx) => {
            const points = this.calculateFieldLine(point.x, point.y, steps);
            
            if (points.length < 2) return;
            
            // 转换为画布坐标
            const canvasPoints = points.map(p => ({
                x: centerX + p.x * scale,
                y: centerY + p.y * scale
            }));
            
            // 绘制线条
            const intensity = Math.sin((idx / startPoints.length + phase) * Math.PI) * 0.3 + 0.7;
            this.ctx.strokeStyle = `rgba(255, 150, 50, ${intensity * 0.8})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y);
            
            for (let i = 1; i < canvasPoints.length; i++) {
                this.ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y);
            }
            this.ctx.stroke();
            
            // 绘制方向箭头（间隔放置）
            const arrowStep = Math.floor(canvasPoints.length / 5);
            for (let i = arrowStep; i < canvasPoints.length - 5; i += arrowStep) {
                if (i + 1 < canvasPoints.length) {
                    this.drawArrow(
                        canvasPoints[i].x, canvasPoints[i].y,
                        canvasPoints[i + 1].x, canvasPoints[i + 1].y
                    );
                }
            }
        });
    }
    
    calculateFieldLine(startX, startY, steps) {
        const points = [{ x: startX, y: startY }];
        let x = startX;
        let y = startY;
        
        const dt = 0.5; // 步长
        const L_cm = this.params.L;
        const R_cm = this.params.R;
        const halfL = L_cm / 2;
        
        for (let i = 0; i < steps; i++) {
            // 计算磁场方向
            const B = this.getFieldDirection(x, y, halfL, R_cm);
            const Bmag = Math.sqrt(B.x * B.x + B.y * B.y);
            
            if (Bmag < 0.001) break;
            
            // 归一化并前进
            const dx = (B.x / Bmag) * dt;
            const dy = (B.y / Bmag) * dt;
            
            x += dx;
            y += dy;
            
            // 边界检查
            if (Math.abs(y) > R_cm * 5 || Math.abs(x) > halfL * 5) break;
            
            points.push({ x, y });
        }
        
        return points;
    }
    
    getFieldDirection(x, y, halfL, R_cm) {
        // 简化的磁场方向计算
        // x: 沿轴线方向, y: 垂直轴线方向
        
        const r = Math.sqrt(x * x + y * y);
        
        if (r < 0.01) return { x: 1, y: 0 };
        
        // 磁偶极子场近似
        // Bx = (3x² - r²) / r^5
        // By = 3xy / r^5
        
        // 偏移偶极子位置到螺线管中心
        const Bx1 = (3 * x * x - r * r) / Math.pow(r + 0.1, 5);
        const By1 = 3 * x * y / Math.pow(r + 0.1, 5);
        
        // 在螺线管内部，磁场主要沿x轴
        const insideFactor = Math.abs(x) < halfL && Math.abs(y) < R_cm ? 10 : 1;
        
        return {
            x: Bx1 * insideFactor + 0.1,
            y: By1
        };
    }
    
    drawArrow(x1, y1, x2, y2) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowSize = 8;
        
        this.ctx.fillStyle = 'rgba(255, 150, 50, 0.9)';
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 - arrowSize * Math.cos(angle - Math.PI / 6),
            y2 - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            x2 - arrowSize * Math.cos(angle + Math.PI / 6),
            y2 - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawHeatMap() {
        if (!this.drawingParams) return;
        
        const { centerX, centerY, scale, L_px, R_px } = this.drawingParams;
        
        // 绘制磁场强度指示器（圆形渐变）
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(L_px, R_px) * 1.5
        );
        
        gradient.addColorStop(0, 'rgba(255, 150, 50, 0.15)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawMouseIndicator() {
        if (!this.mousePos) return;
        
        const { x, y } = this.mousePos;
        
        // 绘制十字光标
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.canvas.height);
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // 绘制指示器圆圈
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 15, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 显示数值
        const B = this.calculateBAtPoint(
            (x - this.drawingParams.centerX) / this.drawingParams.scale,
            (y - this.drawingParams.centerY) / this.drawingParams.scale
        );
        
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${(B * 1000).toFixed(3)} mT`, x + 25, y - 5);
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        this.animationFrame++;
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new SolenoidVisualization();
});