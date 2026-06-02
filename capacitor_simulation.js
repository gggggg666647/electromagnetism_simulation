/**
 * 模块2: 平行板电容器动态变化仿真
 * 功能: 实时计算电容C、电压U、电荷量Q、场强E；绘制电场线
 * 作者: AI辅助编程
 */

class CapacitorSimulation {
    constructor() {
        this.canvas = document.getElementById('capacitorCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 物理常数
        this.epsilon0 = 8.854e-12; // 真空介电常数 F/m
        
        // 物理参数
        this.params = {
            d: 10,         // 极板间距 mm
            S: 100,        // 极板面积 cm²
            epsilonR: 1,   // 相对介电常数
            U: 12,         // 电压 V
            mode: 'voltage' // 'voltage'=接电源U不变, 'charge'=断电源Q不变
        };
        
        // 计算结果
        this.results = {
            C: 0,  // 电容 F
            Q: 0,  // 电荷量 C
            E: 0   // 场强 V/m
        };
        
        // 初始电荷量（用于断电源模式）
        this.fixedQ = 0;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.setupControls();
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
        // 模式切换
        document.querySelectorAll('.mode-btn[data-cap-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn[data-cap-mode]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.params.mode = btn.dataset.capMode;
                
                // 切换模式时保存当前Q值
                if (this.params.mode === 'charge') {
                    this.fixedQ = this.results.Q;
                }
                
                this.calculateValues();
                this.draw();
            });
        });
        
        // 极板间距
        const distance = document.getElementById('distance');
        const distanceValue = document.getElementById('distanceValue');
        distance.addEventListener('input', () => {
            this.params.d = parseFloat(distance.value);
            distanceValue.textContent = this.params.d;
            this.updateCalculation();
        });
        
        // 极板面积
        const area = document.getElementById('area');
        const areaValue = document.getElementById('areaValue');
        area.addEventListener('input', () => {
            this.params.S = parseFloat(area.value);
            areaValue.textContent = this.params.S;
            this.updateCalculation();
        });
        
        // 介电常数
        const dielectric = document.getElementById('dielectric');
        const dielectricValue = document.getElementById('dielectricValue');
        dielectric.addEventListener('input', () => {
            this.params.epsilonR = parseFloat(dielectric.value);
            dielectricValue.textContent = this.params.epsilonR.toFixed(1);
            this.updateCalculation();
        });
        
        // 电压
        const voltage = document.getElementById('voltage');
        const voltageValue = document.getElementById('voltageValue');
        voltage.addEventListener('input', () => {
            this.params.U = parseFloat(voltage.value);
            voltageValue.textContent = this.params.U;
            this.updateCalculation();
        });
        
        // 重置按钮
        document.getElementById('capResetBtn').addEventListener('click', () => this.reset());
    }
    
    reset() {
        document.getElementById('distance').value = 10;
        document.getElementById('distanceValue').textContent = '10';
        document.getElementById('area').value = 100;
        document.getElementById('areaValue').textContent = '100';
        document.getElementById('dielectric').value = 1;
        document.getElementById('dielectricValue').textContent = '1.0';
        document.getElementById('voltage').value = 12;
        document.getElementById('voltageValue').textContent = '12';
        
        this.params.d = 10;
        this.params.S = 100;
        this.params.epsilonR = 1;
        this.params.U = 12;
        
        this.calculateValues();
        this.draw();
    }
    
    updateCalculation() {
        this.calculateValues();
        this.draw();
    }
    
    calculateValues() {
        // 单位转换
        const d = this.params.d * 1e-3;      // mm -> m
        const S = this.params.S * 1e-4;      // cm² -> m²
        const epsilon = this.epsilon0 * this.params.epsilonR;
        
        // 计算电容 C = εS/d
        this.results.C = epsilon * S / d;
        
        if (this.params.mode === 'voltage') {
            // 接电源: U不变
            this.results.Q = this.results.C * this.params.U;
            this.results.E = this.params.U / d;
        } else {
            // 断电源: Q不变
            const U = this.fixedQ / this.results.C;
            this.results.E = U / d;
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        // 转换为合适的单位显示
        const C_nF = this.results.C * 1e9;      // F -> nF
        const Q_nC = (this.params.mode === 'voltage' ? this.results.Q : this.fixedQ) * 1e9; // C -> nC
        const E_kV_m = this.results.E / 1000;   // V/m -> kV/m
        const U_display = this.params.mode === 'voltage' ? this.params.U : (this.fixedQ / this.results.C);
        
        document.getElementById('capacitance').textContent = C_nF.toFixed(3);
        document.getElementById('capVoltage').textContent = U_display.toFixed(2);
        document.getElementById('chargeQ').textContent = Q_nC.toFixed(2);
        document.getElementById('fieldE').textContent = E_kV_m.toFixed(3);
        
        // 更新趋势显示
        this.updateTrend();
    }
    
    updateTrend() {
        const trendBox = document.getElementById('trendBox');
        const trendIcon = document.getElementById('trendIcon');
        const trendText = document.getElementById('trendText');
        
        if (this.params.mode === 'voltage') {
            // U不变模式
            if (this.params.d < 15 && this.params.epsilonR > 3) {
                trendIcon.textContent = '↑↑';
                trendText.textContent = '电容显著增大！';
                trendBox.style.background = 'rgba(0, 255, 136, 0.2)';
            } else if (this.params.d > 40) {
                trendIcon.textContent = '↓↓';
                trendText.textContent = '间距过大，电容减小';
                trendBox.style.background = 'rgba(255, 100, 100, 0.2)';
            } else {
                trendIcon.textContent = '→';
                trendText.textContent = '参数正常';
                trendBox.style.background = 'rgba(255, 255, 255, 0.05)';
            }
        } else {
            // Q不变模式
            if (this.params.d > 30) {
                trendIcon.textContent = '⚡';
                trendText.textContent = '场强增大！U = Q/C = Ed';
                trendBox.style.background = 'rgba(255, 200, 0, 0.2)';
            } else {
                trendIcon.textContent = '→';
                trendText.textContent = '参数正常 (E不变)';
                trendBox.style.background = 'rgba(255, 255, 255, 0.05)';
            }
        }
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景网格
        this.drawGrid();
        
        // 绘制电容器
        this.drawCapacitor();
        
        // 绘制电场线
        this.drawFieldLines();
        
        // 绘制标注
        this.drawLabels();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 30;
        
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
    
    drawCapacitor() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 根据间距d和面积S计算绘制尺寸
        const baseWidth = Math.min(this.canvas.width * 0.6, 300 + this.params.S * 1.5);
        const plateHeight = 25;
        const dScaled = 50 + (this.params.d - 1) * 8; // 间距可视化
        
        const plateWidth = baseWidth;
        
        // 计算极板位置
        const topPlateY = centerY - dScaled / 2 - plateHeight / 2;
        const bottomPlateY = centerY + dScaled / 2 + plateHeight / 2;
        
        // 绘制介质（如果有）
        if (this.params.epsilonR > 1) {
            const dielectricOpacity = Math.min(0.6, (this.params.epsilonR - 1) * 0.1);
            
            const gradient = this.ctx.createLinearGradient(
                centerX - plateWidth / 2, topPlateY + plateHeight,
                centerX - plateWidth / 2, bottomPlateY
            );
            gradient.addColorStop(0, `rgba(100, 200, 255, ${dielectricOpacity})`);
            gradient.addColorStop(1, `rgba(150, 100, 255, ${dielectricOpacity})`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                centerX - plateWidth / 2,
                topPlateY + plateHeight,
                plateWidth,
                dScaled
            );
            
            // 标注介质
            this.ctx.fillStyle = '#64c8ff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `εr = ${this.params.epsilonR.toFixed(1)}`,
                centerX,
                centerY
            );
        }
        
        // 绘制上极板（正极 - 红色）
        const topGradient = this.ctx.createLinearGradient(
            centerX - plateWidth / 2, topPlateY,
            centerX - plateWidth / 2, topPlateY + plateHeight
        );
        topGradient.addColorStop(0, '#ff6b6b');
        topGradient.addColorStop(0.5, '#ff4444');
        topGradient.addColorStop(1, '#cc0000');
        
        this.ctx.fillStyle = topGradient;
        this.ctx.shadowColor = '#ff4444';
        this.ctx.shadowBlur = 20;
        this.roundRect(
            centerX - plateWidth / 2,
            topPlateY,
            plateWidth,
            plateHeight,
            5
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // 绘制下极板（负极 - 蓝色）
        const bottomGradient = this.ctx.createLinearGradient(
            centerX - plateWidth / 2, bottomPlateY,
            centerX - plateWidth / 2, bottomPlateY + plateHeight
        );
        bottomGradient.addColorStop(0, '#4488ff');
        bottomGradient.addColorStop(0.5, '#4466ff');
        bottomGradient.addColorStop(1, '#2244cc');
        
        this.ctx.fillStyle = bottomGradient;
        this.ctx.shadowColor = '#4488ff';
        this.ctx.shadowBlur = 20;
        this.roundRect(
            centerX - plateWidth / 2,
            bottomPlateY,
            plateWidth,
            plateHeight,
            5
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // 绘制连接线
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, topPlateY);
        this.ctx.lineTo(centerX, topPlateY - 40);
        this.ctx.moveTo(centerX, bottomPlateY + plateHeight);
        this.ctx.lineTo(centerX, bottomPlateY + plateHeight + 40);
        this.ctx.stroke();
        
        // 如果是接电源模式，绘制电源符号
        if (this.params.mode === 'voltage') {
            this.drawBattery(centerX, bottomPlateY + plateHeight + 60);
        } else {
            // 断电源模式，绘制断开的导线
            this.ctx.strokeStyle = '#ff8800';
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 20, bottomPlateY + plateHeight + 50);
            this.ctx.lineTo(centerX + 20, bottomPlateY + plateHeight + 50);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            this.ctx.fillStyle = '#ff8800';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Q 恒定 (电源断开)', centerX, bottomPlateY + plateHeight + 85);
        }
        
        // 保存绘制尺寸供电场线绘制使用
        this.drawingParams = {
            centerX,
            centerY,
            plateWidth,
            plateHeight,
            topPlateY,
            bottomPlateY,
            dScaled
        };
    }
    
    roundRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
    }
    
    drawBattery(x, y) {
        const width = 40;
        const height = 30;
        
        // 电池外框
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.rect(x - width / 2, y - height / 2, width, height);
        this.ctx.stroke();
        
        // 正极凸起
        this.ctx.fillStyle = '#888';
        this.ctx.fillRect(x - 5, y - height / 2 - 5, 10, 5);
        
        // 内部正负极标识
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillText('+', x - 10, y);
        
        this.ctx.fillStyle = '#4488ff';
        this.ctx.fillText('−', x + 10, y);
        
        // 电压值
        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`${this.params.U}V`, x, y + height / 2 + 15);
    }
    
    drawFieldLines() {
        if (!this.drawingParams) return;
        
        const { centerX, plateWidth, topPlateY, bottomPlateY, plateHeight, dScaled } = this.drawingParams;
        
        // 根据场强计算电场线密度
        const baseLines = 8;
        const intensity = Math.min(1, this.results.E / 1e6);
        const lineCount = Math.floor(baseLines + intensity * 20);
        
        // 线条参数
        const startY = topPlateY + plateHeight;
        const endY = bottomPlateY;
        const leftBound = centerX - plateWidth / 2 + 20;
        const rightBound = centerX + plateWidth / 2 - 20;
        const spacing = (rightBound - leftBound) / (lineCount - 1);
        
        // 绘制电场线（从上到下带箭头）
        for (let i = 0; i < lineCount; i++) {
            const x = leftBound + i * spacing;
            
            // 线条颜色根据强度变化
            const colorIntensity = 0.3 + intensity * 0.5;
            this.ctx.strokeStyle = `rgba(255, 200, 0, ${colorIntensity})`;
            this.ctx.lineWidth = 1 + intensity;
            
            // 绘制主线
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
            
            // 绘制箭头（每段一个）
            const arrowSpacing = dScaled / 4;
            for (let j = 1; j <= 3; j++) {
                const arrowY = startY + j * arrowSpacing;
                this.drawFieldArrow(x, arrowY, 'down');
            }
        }
        
        // 绘制边缘效应（弯曲的电场线）
        this.drawEdgeEffects(leftBound, rightBound, startY, endY, intensity);
    }
    
    drawFieldArrow(x, y, direction) {
        const arrowSize = 6;
        
        this.ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
        this.ctx.beginPath();
        
        if (direction === 'down') {
            this.ctx.moveTo(x, y + arrowSize);
            this.ctx.lineTo(x - arrowSize, y);
            this.ctx.lineTo(x + arrowSize, y);
        } else {
            this.ctx.moveTo(x, y - arrowSize);
            this.ctx.lineTo(x - arrowSize, y);
            this.ctx.lineTo(x + arrowSize, y);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawEdgeEffects(leftBound, rightBound, startY, endY, intensity) {
        // 左侧边缘的弯曲电场线
        this.ctx.strokeStyle = `rgba(255, 200, 0, ${0.2 + intensity * 0.2})`;
        this.ctx.lineWidth = 1;
        
        const edgeLines = 3;
        const curveDepth = 40;
        
        for (let i = 1; i <= edgeLines; i++) {
            const offset = i * 15;
            
            // 左侧向外弯曲
            this.ctx.beginPath();
            this.ctx.moveTo(leftBound, startY + offset);
            this.ctx.quadraticCurveTo(
                leftBound - curveDepth * i / edgeLines,
                (startY + endY) / 2,
                leftBound,
                endY - offset
            );
            this.ctx.stroke();
            
            // 右侧向外弯曲
            this.ctx.beginPath();
            this.ctx.moveTo(rightBound, startY + offset);
            this.ctx.quadraticCurveTo(
                rightBound + curveDepth * i / edgeLines,
                (startY + endY) / 2,
                rightBound,
                endY - offset
            );
            this.ctx.stroke();
        }
    }
    
    drawLabels() {
        if (!this.drawingParams) return;
        
        const { centerX, plateWidth, topPlateY, bottomPlateY, plateHeight, dScaled } = this.drawingParams;
        
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        
        // 标注上极板
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillText('+Q', centerX - plateWidth / 2 - 30, topPlateY + plateHeight / 2);
        
        // 标注下极板
        this.ctx.fillStyle = '#4488ff';
        this.ctx.fillText('−Q', centerX - plateWidth / 2 - 30, bottomPlateY + plateHeight / 2);
        
        // 标注间距d
        this.ctx.fillStyle = '#00ff88';
        this.ctx.fillText(
            `d = ${this.params.d} mm`,
            centerX + plateWidth / 2 + 50,
            (topPlateY + bottomPlateY + plateHeight) / 2
        );
        
        // 标注面积S
        this.ctx.fillStyle = '#00d9ff';
        this.ctx.fillText(
            `S = ${this.params.S} cm²`,
            centerX,
            topPlateY - 50
        );
        
        // 绘制参数变化提示
        this.drawChangeIndicator();
    }
    
    drawChangeIndicator() {
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        
        const indicators = [];
        
        if (this.params.epsilonR > 1) {
            indicators.push({ text: `εr ↑ → C ↑`, color: '#64c8ff' });
        }
        
        if (this.params.mode === 'voltage') {
            if (this.params.d < 10) {
                indicators.push({ text: `d ↓ → C ↑ → Q ↑`, color: '#00ff88' });
            } else if (this.params.d > 30) {
                indicators.push({ text: `d ↑ → C ↓ → Q ↓`, color: '#ff6b6b' });
            }
        } else {
            indicators.push({ text: `Q 恒定`, color: '#ff8800' });
            if (this.params.d > 20) {
                indicators.push({ text: `d ↑ → C ↓ → U ↑`, color: '#ff6b6b' });
            }
        }
        
        indicators.forEach((ind, i) => {
            this.ctx.fillStyle = ind.color;
            this.ctx.fillText(ind.text, 20, 30 + i * 25);
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new CapacitorSimulation();
});