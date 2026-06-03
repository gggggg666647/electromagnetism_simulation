class SolenoidVisualization {
    constructor() {
        this.canvas = document.getElementById('solenoidCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.mu0 = 4 * Math.PI * 1e-7;
        this.params = { N: 100, I: 2, L: 20, R: 3, lineCount: 15, precision: 'medium', showVectors: true };
        this.camera = { yaw: -0.55, pitch: -0.28, zoom: 1 };
        this.mousePos = null;
        this.dragState = null;
        this.isAnimating = false;
        this.animationFrame = 0;

        this.resizeCanvas();
        this.setupControls();
        this.setupMouse();
        this.calculate();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container.clientWidth) return;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight || 700;
        this.draw();
    }

    setupControls() {
        this.bindRange('turns', 'turnsValue', 'N', parseInt);
        this.bindRange('current', 'currentValue', 'I', parseFloat, 1);
        this.bindRange('length', 'lengthValue', 'L', parseFloat);
        this.bindRange('radius', 'radiusValue', 'R', parseFloat);
        this.bindRange('lineCount', 'lineCountValue', 'lineCount', parseInt);

        document.querySelectorAll('input[name="precision"]').forEach((radio) => {
            radio.addEventListener('change', () => {
                this.params.precision = radio.value;
                this.draw();
            });
        });

        document.getElementById('showVectorField').addEventListener('change', (event) => {
            this.params.showVectors = event.target.checked;
            this.draw();
        });

        document.getElementById('solResetBtn').addEventListener('click', () => this.reset());
        document.getElementById('animateBtn').addEventListener('click', () => this.toggleAnimation());
    }

    bindRange(inputId, outputId, param, parser, digits = null) {
        const input = document.getElementById(inputId);
        const output = document.getElementById(outputId);
        input.addEventListener('input', () => {
            this.params[param] = parser(input.value);
            output.textContent = digits === null ? this.params[param] : this.params[param].toFixed(digits);
            this.calculate();
            this.draw();
        });
    }

    setupMouse() {
        this.canvas.addEventListener('pointerdown', (event) => {
            this.dragState = {
                x: event.clientX,
                y: event.clientY,
                yaw: this.camera.yaw,
                pitch: this.camera.pitch
            };
            this.canvas.setPointerCapture(event.pointerId);
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('pointermove', (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos = { x: event.clientX - rect.left, y: event.clientY - rect.top };
            if (this.dragState) {
                this.camera.yaw = this.dragState.yaw + (event.clientX - this.dragState.x) * 0.008;
                this.camera.pitch = this.clamp(
                    this.dragState.pitch + (event.clientY - this.dragState.y) * 0.008,
                    -1.1,
                    1.1
                );
            }
            this.updateMouseInfo();
            this.draw();
        });

        this.canvas.addEventListener('pointerup', (event) => {
            this.dragState = null;
            this.canvas.releasePointerCapture(event.pointerId);
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('pointerleave', () => {
            if (this.dragState) return;
            this.mousePos = null;
            document.getElementById('mouseB').textContent = '--';
            document.getElementById('mousePos').textContent = '--';
            this.draw();
        });

        this.canvas.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.camera.zoom = this.clamp(this.camera.zoom - event.deltaY * 0.001, 0.65, 1.7);
            this.draw();
        }, { passive: false });
    }

    reset() {
        this.params = { N: 100, I: 2, L: 20, R: 3, lineCount: 15, precision: 'medium', showVectors: true };
        this.camera = { yaw: -0.55, pitch: -0.28, zoom: 1 };
        const values = {
            turns: '100',
            turnsValue: '100',
            current: '2',
            currentValue: '2.0',
            length: '20',
            lengthValue: '20',
            radius: '3',
            radiusValue: '3',
            lineCount: '15',
            lineCountValue: '15'
        };
        Object.entries(values).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if ('value' in element) element.value = value;
            else element.textContent = value;
        });
        document.querySelector('input[name="precision"][value="medium"]').checked = true;
        document.getElementById('showVectorField').checked = true;
        this.calculate();
        this.draw();
    }

    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        document.getElementById('animateBtn').textContent = this.isAnimating ? '停止动画' : '磁场动画';
        if (this.isAnimating) this.animate();
    }

    calculate() {
        const density = this.params.N / (this.params.L * 0.01);
        this.centerB = this.mu0 * density * this.params.I;
        document.getElementById('centerB').textContent = (this.centerB * 1000).toFixed(2);
        document.getElementById('endB').textContent = (this.centerB * 500).toFixed(2);
        document.getElementById('turnDensity').textContent = Math.round(density);
    }

    clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    getScale() {
        const base = Math.min(this.canvas.width || 700, this.canvas.height || 700);
        return base / (this.params.L * 2.4) * this.camera.zoom;
    }

    project(point) {
        const cosYaw = Math.cos(this.camera.yaw);
        const sinYaw = Math.sin(this.camera.yaw);
        const cosPitch = Math.cos(this.camera.pitch);
        const sinPitch = Math.sin(this.camera.pitch);
        const x = point.x * cosYaw - point.z * sinYaw;
        const depth = point.x * sinYaw + point.z * cosYaw;
        const y = point.y * cosPitch - depth * sinPitch;
        const z = point.y * sinPitch + depth * cosPitch;
        const scale = this.getScale();
        return {
            x: this.canvas.width / 2 + x * scale,
            y: this.canvas.height / 2 - y * scale,
            depth: z
        };
    }

    screenToCenterPlane(screenX, screenY) {
        const scale = this.getScale();
        const sx = (screenX - this.canvas.width / 2) / scale;
        const sy = -(screenY - this.canvas.height / 2) / scale;
        const cosYaw = Math.cos(this.camera.yaw);
        const sinYaw = Math.sin(this.camera.yaw);
        const cosPitch = Math.cos(this.camera.pitch);
        const sinPitch = Math.sin(this.camera.pitch);
        const x = sx / cosYaw;
        const y = (sy + x * sinYaw * sinPitch) / cosPitch;
        return { x, y, z: 0 };
    }

    getFieldVector(x, radialDistance) {
        const halfL = this.params.L / 2;
        if (Math.abs(x) <= halfL && radialDistance <= this.params.R) {
            return { axial: this.centerB, radial: 0 };
        }

        const distance = Math.max(Math.hypot(x, radialDistance), this.params.R * 0.8, 0.5);
        const strength = this.centerB * Math.pow(this.params.R / distance, 3);
        return {
            axial: strength * (3 * x * x / (distance * distance) - 1),
            radial: strength * (3 * x * radialDistance / (distance * distance))
        };
    }

    getFieldVector3D(point) {
        const radialDistance = Math.hypot(point.y, point.z);
        const field = this.getFieldVector(point.x, radialDistance);
        if (radialDistance < 1e-6) {
            return { x: field.axial, y: 0, z: 0 };
        }
        return {
            x: field.axial,
            y: field.radial * point.y / radialDistance,
            z: field.radial * point.z / radialDistance
        };
    }

    updateMouseInfo() {
        if (!this.mousePos) return;
        const point = this.screenToCenterPlane(this.mousePos.x, this.mousePos.y);
        const field = this.getFieldVector(point.x, Math.abs(point.y));
        document.getElementById('mouseB').textContent = (Math.hypot(field.axial, field.radial) * 1000).toFixed(3);
        document.getElementById('mousePos').textContent = `(${point.x.toFixed(1)}, ${point.y.toFixed(1)}, 0.0) cm`;
    }

    draw() {
        this.ctx.fillStyle = '#070b19';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        if (!this.canvas.width) return;
        this.drawBackdrop();
        if (this.params.showVectors) this.drawVectorField();
        this.drawCylinder();
        this.drawHelix();
        this.drawLabels();
        this.drawMouseIndicator();
    }

    drawBackdrop() {
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2,
            this.canvas.height / 2,
            0,
            this.canvas.width / 2,
            this.canvas.height / 2,
            this.canvas.width * 0.65
        );
        gradient.addColorStop(0, 'rgba(18, 45, 85, 0.5)');
        gradient.addColorStop(1, 'rgba(3, 7, 18, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const floorY = -this.params.R * 2.5;
        const extent = this.params.L * 1.25;
        this.ctx.lineWidth = 1;
        for (let x = -extent; x <= extent; x += this.params.L / 10) {
            this.drawPolyline([
                { x, y: floorY, z: -extent },
                { x, y: floorY, z: extent }
            ], 'rgba(80, 150, 255, 0.12)');
        }
        for (let z = -extent; z <= extent; z += this.params.L / 10) {
            this.drawPolyline([
                { x: -extent, y: floorY, z },
                { x: extent, y: floorY, z }
            ], 'rgba(80, 150, 255, 0.12)');
        }
    }

    drawVectorField() {
        const qualityOffset = this.params.precision === 'high' ? 1 : this.params.precision === 'low' ? -1 : 0;
        const scale = this.getScale();
        const near = {
            x: this.params.L * 0.72,
            y: this.params.R * 2.2,
            z: this.params.R * 2.2
        };
        const middle = {
            x: Math.max(this.params.L * 1.12, this.canvas.width / scale * 0.34),
            y: Math.max(this.params.R * 4.4, this.canvas.height / scale * 0.3),
            z: Math.max(this.params.R * 4.8, this.canvas.height / scale * 0.36)
        };
        const far = {
            x: Math.max(this.params.L * 1.7, this.canvas.width / scale * 0.48),
            y: Math.max(this.params.L, this.canvas.height / scale * 0.48),
            z: Math.max(this.params.L, this.canvas.height / scale * 0.55)
        };
        const vectors = [];

        const addLayer = (extent, counts, innerExtent = null) => {
            for (let xi = 0; xi < counts.x; xi++) {
                const x = -extent.x + xi * extent.x * 2 / (counts.x - 1);
                for (let yi = 0; yi < counts.y; yi++) {
                    const y = -extent.y + yi * extent.y * 2 / (counts.y - 1);
                    for (let zi = 0; zi < counts.z; zi++) {
                        const z = -extent.z + zi * extent.z * 2 / (counts.z - 1);
                        if (innerExtent &&
                            Math.abs(x) <= innerExtent.x &&
                            Math.abs(y) <= innerExtent.y &&
                            Math.abs(z) <= innerExtent.z) {
                            continue;
                        }
                        const point = { x, y, z };
                        const field = this.getFieldVector3D(point);
                        const magnitude = Math.hypot(field.x, field.y, field.z);
                        if (magnitude < Number.EPSILON) continue;
                        vectors.push({ point, field, magnitude, depth: this.project(point).depth });
                    }
                }
            }
        };

        addLayer(near, {
            x: this.clamp(Math.round(this.params.lineCount * 0.24) + 5 + qualityOffset, 6, 11),
            y: this.clamp(Math.round(this.params.lineCount * 0.12) + 3 + qualityOffset, 4, 6),
            z: this.clamp(Math.round(this.params.lineCount * 0.1) + 3 + qualityOffset, 4, 6)
        });
        addLayer(middle, {
            x: this.clamp(Math.round(this.params.lineCount * 0.14) + 4 + qualityOffset, 5, 8),
            y: this.clamp(Math.round(this.params.lineCount * 0.08) + 3 + qualityOffset, 3, 5),
            z: this.clamp(Math.round(this.params.lineCount * 0.06) + 3 + qualityOffset, 3, 5)
        }, near);
        addLayer(far, {
            x: this.clamp(Math.round(this.params.lineCount * 0.08) + 3 + qualityOffset, 4, 6),
            y: this.clamp(Math.round(this.params.lineCount * 0.05) + 3 + qualityOffset, 3, 4),
            z: this.clamp(Math.round(this.params.lineCount * 0.04) + 2 + qualityOffset, 3, 4)
        }, middle);

        this.lastVectorCount = vectors.length;
        vectors.sort((a, b) => a.depth - b.depth).forEach((vector) => this.drawVectorArrow(vector));
    }

    drawVectorArrow(vector) {
        const { point, field, magnitude } = vector;
        const relativeStrength = magnitude / this.centerB;
        const strength = this.clamp(Math.pow(relativeStrength, 0.24), 0.1, 1);
        const length = this.params.L * (0.018 + strength * 0.11);
        const endpoint = {
            x: point.x + field.x / magnitude * length,
            y: point.y + field.y / magnitude * length,
            z: point.z + field.z / magnitude * length
        };
        const start = this.project(point);
        const end = this.project(endpoint);
        const hue = 195 - strength * 150;
        const baseAlpha = 0.18 + strength * 0.68;
        const pulse = this.isAnimating ? baseAlpha + Math.sin(this.animationFrame * 0.08 + point.x) * 0.1 : baseAlpha;
        this.drawScreenArrow(start.x, start.y, end.x, end.y, `hsla(${hue}, 95%, 65%, ${pulse})`, 0.65 + strength * 1.25);
    }

    drawCylinder() {
        const halfL = this.params.L / 2;
        const topA = this.project({ x: -halfL, y: this.params.R, z: 0 });
        const topB = this.project({ x: halfL, y: this.params.R, z: 0 });
        const bottomB = this.project({ x: halfL, y: -this.params.R, z: 0 });
        const bottomA = this.project({ x: -halfL, y: -this.params.R, z: 0 });
        const shell = this.ctx.createLinearGradient(topA.x, topA.y, bottomB.x, bottomB.y);
        shell.addColorStop(0, 'rgba(70, 130, 255, 0.05)');
        shell.addColorStop(0.5, 'rgba(70, 170, 255, 0.16)');
        shell.addColorStop(1, 'rgba(70, 130, 255, 0.04)');
        this.ctx.fillStyle = shell;
        this.ctx.beginPath();
        this.ctx.moveTo(topA.x, topA.y);
        this.ctx.lineTo(topB.x, topB.y);
        this.ctx.lineTo(bottomB.x, bottomB.y);
        this.ctx.lineTo(bottomA.x, bottomA.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.drawRing(-halfL, this.params.R, 'rgba(100, 190, 255, 0.65)', 1.5);
        this.drawRing(halfL, this.params.R, 'rgba(100, 190, 255, 0.65)', 1.5);
    }

    drawHelix() {
        const halfL = this.params.L / 2;
        const turns = Math.min(38, Math.max(10, Math.round(this.params.N / 4)));
        const segments = turns * 20;
        let previous = null;
        this.ctx.lineCap = 'round';
        for (let index = 0; index <= segments; index++) {
            const progress = index / segments;
            const angle = progress * turns * Math.PI * 2;
            const point = this.project({
                x: -halfL + this.params.L * progress,
                y: this.params.R * Math.cos(angle),
                z: this.params.R * Math.sin(angle)
            });
            if (previous) {
                const light = this.clamp(58 + point.depth / this.params.R * 12, 35, 78);
                this.ctx.strokeStyle = `hsl(215, 95%, ${light}%)`;
                this.ctx.lineWidth = point.depth > 0 ? 3.2 : 2;
                this.ctx.beginPath();
                this.ctx.moveTo(previous.x, previous.y);
                this.ctx.lineTo(point.x, point.y);
                this.ctx.stroke();
            }
            previous = point;
        }
        this.ctx.lineCap = 'butt';
    }

    drawLabels() {
        const halfL = this.params.L / 2;
        const north = this.project({ x: halfL + 1.5, y: 0, z: 0 });
        const south = this.project({ x: -halfL - 1.5, y: 0, z: 0 });
        this.ctx.font = 'bold 22px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ff6666';
        this.ctx.fillText('N', north.x, north.y);
        this.ctx.fillStyle = '#77aaff';
        this.ctx.fillText('S', south.x, south.y);
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#77ddff';
        this.ctx.fillText(`N = ${this.params.N} 匝  |  I = ${this.params.I.toFixed(1)} A`, this.canvas.width / 2, 34);
        this.ctx.fillStyle = 'rgba(180, 220, 255, 0.75)';
        this.ctx.fillText('拖拽旋转视角  |  滚轮缩放', this.canvas.width / 2, this.canvas.height - 24);
    }

    drawMouseIndicator() {
        if (!this.mousePos || this.dragState) return;
        this.ctx.strokeStyle = 'rgba(0, 255, 136, 0.9)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(this.mousePos.x, this.mousePos.y, 11, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawRing(x, radius, color, width) {
        const points = [];
        for (let index = 0; index <= 64; index++) {
            const angle = index / 64 * Math.PI * 2;
            points.push({ x, y: radius * Math.cos(angle), z: radius * Math.sin(angle) });
        }
        this.drawPolyline(points, color, width);
    }

    drawPolyline(points, color, width = 1) {
        if (points.length < 2) return;
        const projected = points.map((point) => this.project(point));
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(projected[0].x, projected[0].y);
        projected.slice(1).forEach((point) => this.ctx.lineTo(point.x, point.y));
        this.ctx.stroke();
    }

    drawScreenArrow(x1, y1, x2, y2, color, width = 2) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headSize = this.clamp(Math.hypot(x2 - x1, y2 - y1) * 0.36, 3, 8);
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headSize * Math.cos(angle - Math.PI / 6), y2 - headSize * Math.sin(angle - Math.PI / 6));
        this.ctx.lineTo(x2 - headSize * Math.cos(angle + Math.PI / 6), y2 - headSize * Math.sin(angle + Math.PI / 6));
        this.ctx.closePath();
        this.ctx.fill();
    }

    animate() {
        if (!this.isAnimating) return;
        this.animationFrame++;
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => new SolenoidVisualization());
