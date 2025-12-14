import { useEffect, useRef, useMemo, useState } from 'react'
import * as THREE from 'three'

interface ParticleArrayLoaderProps {
  status: 'booting' | 'installing' | 'starting'
  message: string
}

// Vertex Shader
const vertexShader = `
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float pnoise(vec3 P, vec3 rep) {
  vec3 Pi0 = mod(floor(P), rep);
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

uniform float time;
varying vec2 vUv;
varying vec3 pos;
varying float noise;
attribute float size;

float fac = 10.0;

float turbulence(vec3 p) {
  float t = -.5;
  for (float f = 1.0; f <= 1.0; f++) {
    float power = pow(2.0, f);
    t += abs(pnoise(vec3(power * p), vec3(fac, fac, fac)) / power);
  }
  return t;
}

void main() {
  vUv = uv * 200.0;
  noise = 10.0 * -.10 * turbulence(.5 * normalize(position) + time);
  float b = 5.0 * pnoise(0.05 * position, vec3(100.0));
  float displacement = (-10. * noise) + b;
  vec3 newPosition = position + (normalize(position) * displacement);
  pos = newPosition;
  vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
  gl_PointSize = size * (300. / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`

// Fragment Shader - 与 a.js 完全一致
const fragmentShader = `
varying vec2 vUv;
varying float noise;
varying vec3 pos;
uniform float time;
uniform sampler2D uTexture;

void main() {
  // 与 a.js 完全一致的颜色计算
  float r = 1. - 2.0 * noise;
  float g = 0.0;
  float b = 1. - 1.0 * noise;
  vec3 foo = vec3(r*2.0, g, b*1.5);
  
  // 应用纹理 - 与 a.js 一致
  vec4 texColor = texture2D(uTexture, gl_PointCoord);
  gl_FragColor = vec4(foo, 1.0) * texColor;
  
  // 降低 alpha 测试阈值，确保十字形粒子可见
  if (gl_FragColor.a < 0.1) discard;
}
`

// 创建十字形纹理 - 与参考效果一致
function createCircleTexture(resolution = 64, radius = 32, color = '#ffffff'): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.height = resolution
  canvas.width = resolution
  
  const centerX = resolution / 2
  const centerY = resolution / 2
  
  // 绘制十字形
  const crossLength = radius * 0.8 // 十字的长度
  const crossWidth = Math.max(4, radius * 0.25) // 十字的宽度
  
  ctx.fillStyle = color
  
  // 水平线
  ctx.fillRect(
    centerX - crossLength, 
    centerY - crossWidth / 2, 
    crossLength * 2, 
    crossWidth
  )
  
  // 垂直线
  ctx.fillRect(
    centerX - crossWidth / 2, 
    centerY - crossLength, 
    crossWidth, 
    crossLength * 2
  )
  
  return canvas
}

export default function ParticleArrayLoader({ status, message }: ParticleArrayLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    sphere: THREE.Points
    animationId: number
  } | null>(null)

  const [displayProgress, setDisplayProgress] = useState(0)
  const [dots, setDots] = useState('')

  const progress = useMemo(() => {
    switch (status) {
      case 'booting': return 33
      case 'installing': return 66
      case 'starting': return 95
      default: return 0
    }
  }, [status])

  // 动画进度条
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        const diff = progress - prev
        if (Math.abs(diff) < 1) return progress
        return prev + diff * 0.1
      })
    }, 50)
    return () => clearInterval(interval)
  }, [progress])

  // 动态省略号
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // 状态配置
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'booting':
        return {
          icon: '⚡',
          title: '启动环境',
          subtitle: '正在初始化 WebContainer 虚拟运行时',
          step: 1
        }
      case 'installing':
        return {
          icon: '📦',
          title: '安装依赖',
          subtitle: '正在下载并安装 npm 依赖包',
          step: 2
        }
      case 'starting':
        return {
          icon: '🚀',
          title: '启动服务',
          subtitle: '正在启动 Vite 开发服务器',
          step: 3
        }
      default:
        return {
          icon: '⏳',
          title: '准备中',
          subtitle: '请稍候',
          step: 0
        }
    }
  }, [status])

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    // 确保容器有尺寸
    const width = container.offsetWidth || window.innerWidth
    const height = container.offsetHeight || window.innerHeight

    if (width === 0 || height === 0) {
      console.warn('ParticleArrayLoader: Container has no size')
      return
    }

    // 创建渲染器 - 与 a.js 完全一致
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0) // 透明背景
    container.appendChild(renderer.domElement)

    // 创建场景和相机 - 与 a.js 一致
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000)
    camera.position.set(80, 0, 0) // 与 a.js 一致
    camera.lookAt(scene.position)
    scene.add(camera)

    // 创建几何体 - 增加细分级别使粒子更密集（与参考效果一致）
    const geo = new THREE.IcosahedronGeometry(20, 7)
    // 在新版 Three.js 中，顶点数据在 attributes.position.array 中
    const positionAttr = geo.attributes.position
    const vertexCount = positionAttr.count
    const positions = new Float32Array(vertexCount * 3)
    const sizes = new Float32Array(vertexCount)

    // 初始化顶点和大小 - 与 a.js 一致
    const PARTICLE_SIZE = 1
    // 复制顶点数据，确保与 a.js 的处理方式一致
    for (let i = 0; i < vertexCount; i++) {
      positions[i * 3] = positionAttr.getX(i)
      positions[i * 3 + 1] = positionAttr.getY(i)
      positions[i * 3 + 2] = positionAttr.getZ(i)
      sizes[i] = PARTICLE_SIZE
    }

    // 创建缓冲几何 - 与 a.js 完全一致
    const bufferGeo = new THREE.BufferGeometry()
    bufferGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    bufferGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // 创建粒子纹理 - 与 a.js 完全一致
    const textureAttr = {
      resolution: 64,
      radius: 32,
      color: '#ffffff'
    }
    const circleCanvas = createCircleTexture(textureAttr.resolution, textureAttr.radius, textureAttr.color)
    const texture = new THREE.CanvasTexture(circleCanvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    // 创建着色器材料 - 调整 alphaTest 确保十字形粒子可见
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        uTexture: { value: texture }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      alphaTest: 0.1 // 降低阈值，确保十字形粒子可见
    })

    // 创建点云 - 与 a.js 完全一致
    const sphere = new THREE.Points(bufferGeo, material)
    sphere.rotation.set(0, Math.PI, 0)
    scene.add(sphere)

    // 处理窗口大小变化
    const handleResize = () => {
      const w = container.offsetWidth
      const h = container.offsetHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)

    // 动画循环 - 与 a.js 完全一致
    let animationId = 0
    
    const animate = () => {
      // 更新时间uniform - 与 a.js 一致
      material.uniforms.time.value += 0.0025
      
      // 渲染场景
      renderer.render(scene, camera)
      animationId = requestAnimationFrame(animate)
    }
    animationId = requestAnimationFrame(animate)

    sceneRef.current = { renderer, scene, camera, sphere, animationId }

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      renderer.dispose()
      material.dispose()
      bufferGeo.dispose()
      texture.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Three.js 容器 - 粒子效果占据全屏 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 全新设计 - 极简、聚焦、动态 */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto">
        <div className="relative w-full max-w-2xl mx-4">
          {/* 主视觉区域 - 圆形进度环设计 */}
          <div className="flex flex-col items-center justify-center gap-8">
            
            {/* 大型圆形进度指示器 - 替代传统进度条 */}
            <div className="relative w-48 h-48">
              {/* 外圈进度环 */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - displayProgress / 100)}`}
                  className="transition-all duration-500 ease-out"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))'
                  }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* 中心内容 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div 
                  className="text-5xl mb-2"
                  style={{
                    filter: 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.8))',
                    animation: 'icon-pulse 2s ease-in-out infinite'
                  }}
                >
                  {statusConfig.icon}
                </div>
                <div 
                  className="text-4xl font-black font-mono tabular-nums"
                  style={{
                    background: 'linear-gradient(135deg, #e9d5ff 0%, #c084fc 50%, #9333ea 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-0.05em'
                  }}
                >
                  {Math.round(displayProgress)}%
                </div>
              </div>
              
              {/* 旋转光效 */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, rgba(168, 85, 247, 0.3) 60deg, transparent 120deg)',
                  animation: 'rotate-glow 3s linear infinite',
                  filter: 'blur(20px)'
                }}
              />
            </div>

            {/* 状态文本 - 极简设计 */}
            <div className="text-center space-y-3">
              <h2 
                className="text-3xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #e9d5ff 50%, #c084fc 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.03em'
                }}
              >
                {statusConfig.title}
              </h2>
              <p className="text-white/60 text-sm font-medium tracking-wide">
                {statusConfig.subtitle}
              </p>
            </div>

            {/* 动态状态指示 - 流动的粒子效果 */}
            <div className="relative w-full max-w-md h-1 overflow-hidden">
              <div 
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 0.3) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'flow 2s linear infinite',
                  transform: `scaleX(${displayProgress / 100})`,
                  transformOrigin: 'left'
                }}
              />
            </div>

            {/* 实时消息 - 终端风格 */}
            <div className="mt-4 px-4 py-2 rounded-lg backdrop-blur-sm bg-black/20 border border-white/10">
              <code className="text-xs text-white/70 font-mono flex items-center gap-2">
                <span 
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #9333ea)',
                    boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)',
                    animation: 'blink 1.5s ease-in-out infinite'
                  }}
                />
                <span className="text-white/90">{message}</span>
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* 动画 CSS */}
      <style>{`
        @keyframes icon-pulse {
          0%, 100% { 
            transform: scale(1) rotate(0deg);
            filter: drop-shadow(0 0 12px rgba(139, 92, 246, 0.8));
          }
          50% { 
            transform: scale(1.1) rotate(5deg);
            filter: drop-shadow(0 0 20px rgba(139, 92, 246, 1));
          }
        }
        
        @keyframes rotate-glow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes flow {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
