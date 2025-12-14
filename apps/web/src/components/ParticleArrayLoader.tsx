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

// Fragment Shader
const fragmentShader = `
varying vec2 vUv;
varying float noise;
varying vec3 pos;
uniform float time;
uniform sampler2D particleTexture;

void main() {
  // 黑白和蓝色渐变效果（与 a.js 一致）
  float r = 1. - 2.0 * noise;
  float g = 0.0;
  float b = 1. - 1.0 * noise;
  vec3 color = vec3(r*2.0, g, b*1.5);
  
  // 应用纹理和透明度
  vec4 texColor = texture2D(particleTexture, gl_PointCoord);
  gl_FragColor = vec4(color, 1.0) * texColor;
  
  if (gl_FragColor.a < 0.9) discard;
}
`

function createCircleTexture(resolution = 64, radius = 32, color = '#ffffff'): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.height = resolution
  canvas.width = resolution
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(resolution / 2, resolution / 2, radius, 0, Math.PI * 2)
  ctx.fill()
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
    const width = container.offsetWidth
    const height = container.offsetHeight

    // 创建渲染器 - 优化抗锯齿和性能
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      precision: 'highp',
      powerPreference: 'high-performance'
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 限制像素比以提高性能
    renderer.setClearColor(0x0a0a1a, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // 创建场景和相机
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000)
    camera.position.set(80, 0, 0)
    camera.lookAt(scene.position)
    scene.add(camera)

    // 创建几何体 - 使用更高细节的球体
    const geo = new THREE.IcosahedronGeometry(20, 5)
    const vertices = geo.attributes.position.array as Float32Array
    const vertexCount = vertices.length / 3
    const positions = new Float32Array(vertexCount * 3)
    const sizes = new Float32Array(vertexCount)

    // 初始化顶点和大小
    for (let i = 0; i < vertexCount; i++) {
      positions[i * 3] = vertices[i * 3]
      positions[i * 3 + 1] = vertices[i * 3 + 1]
      positions[i * 3 + 2] = vertices[i * 3 + 2]
      sizes[i] = 1.0
    }

    // 创建缓冲几何
    const bufferGeo = new THREE.BufferGeometry()
    bufferGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    bufferGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // 创建粒子纹理
    const circleCanvas = createCircleTexture(64, 32, '#ffffff')
    const texture = new THREE.CanvasTexture(circleCanvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearMipmapLinearFilter

    // 创建着色器材料
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        particleTexture: { value: texture }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })

    // 创建点云
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

    // 动画循环
    let animationId = 0
    
    const animate = () => {
      // 更新时间uniform
      material.uniforms.time.value += 0.0025
      
      // 平滑旋转
      sphere.rotation.y += 0.003
      
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
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ background: '#0a0a1a' }}>
      {/* Three.js 容器 */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      
      {/* 渐变遮罩 */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(circle at center, transparent 25%, rgba(10, 10, 26, 0.6) 65%, rgba(10, 10, 26, 0.95) 100%)'
      }} />

      {/* 主内容面板 */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* 玻璃卡片 */}
        <div 
          className="backdrop-blur-2xl rounded-3xl p-8 border border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255,255,255,0.15), 0 0 60px rgba(217, 70, 239, 0.1)'
          }}
        >
          {/* 步骤指示器 */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    transition-all duration-500 ease-out relative
                    ${step < statusConfig.step 
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-purple-500/40 scale-100' 
                      : step === statusConfig.step 
                        ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-purple-500/60 scale-125' 
                        : 'bg-white/10 text-white/40 border border-white/20'}
                  `}
                >
                  {step < statusConfig.step ? (
                    <span className="text-lg">✓</span>
                  ) : (
                    step
                  )}
                  {step === statusConfig.step && (
                    <div className="absolute inset-0 rounded-full animate-pulse" style={{
                      background: 'radial-gradient(circle, rgba(217, 70, 239, 0.3), transparent)',
                      border: '2px solid rgba(217, 70, 239, 0.5)'
                    }} />
                  )}
                </div>
                {step < 3 && (
                  <div className="w-14 h-1 mx-1 rounded-full overflow-hidden bg-white/10 border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 transition-all duration-500 relative"
                      style={{ width: step < statusConfig.step ? '100%' : '0%' }}
                    >
                      {step < statusConfig.step && (
                        <div className="absolute inset-0 opacity-50" style={{
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                          animation: 'shimmer 2s infinite'
                        }} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 图标 */}
          <div className="flex justify-center mb-8">
            <div 
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl relative"
              style={{
                background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
                boxShadow: '0 0 80px rgba(217, 70, 239, 0.4), inset 0 1px 2px rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span className="animate-bounce drop-shadow-lg">{statusConfig.icon}</span>
              {/* 脉冲环 */}
              <div className="absolute inset-0 rounded-3xl animate-pulse opacity-30" style={{
                background: 'linear-gradient(135deg, #d946ef, #8b5cf6)',
                border: '2px solid rgba(217, 70, 239, 0.3)'
              }} />
            </div>
          </div>

          {/* 标题 */}
          <h2 
            className="text-3xl font-bold text-center mb-3 tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #f0abfc 0%, #c084fc 50%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 10px rgba(217, 70, 239, 0.2)'
            }}
          >
            {statusConfig.title}{dots}
          </h2>
          
          <p className="text-center text-white/60 text-sm mb-10 font-medium leading-relaxed">
            {statusConfig.subtitle}
          </p>

          {/* 进度条 */}
          <div className="relative mb-6">
            <div className="h-2.5 rounded-full bg-white/5 overflow-hidden border border-white/10">
              <div 
                className="h-full rounded-full transition-all duration-300 ease-out relative"
                style={{ 
                  width: `${displayProgress}%`,
                  background: 'linear-gradient(90deg, #d946ef 0%, #8b5cf6 50%, #6366f1 100%)',
                  boxShadow: '0 0 20px rgba(217, 70, 239, 0.6), inset 0 0 10px rgba(255,255,255,0.2)'
                }}
              >
                {/* 闪光效果 */}
                <div 
                  className="absolute inset-0 opacity-60"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                    animation: 'shimmer 2s infinite'
                  }}
                />
              </div>
            </div>
            
            {/* 进度百分比 */}
            <div className="flex justify-between mt-3 text-xs">
              <span className="text-white/50 font-medium">进度</span>
              <span 
                className="font-mono font-bold text-sm"
                style={{
                  background: 'linear-gradient(135deg, #d946ef, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {Math.round(displayProgress)}%
              </span>
            </div>
          </div>

          {/* 状态消息 */}
          <div 
            className="rounded-xl p-4 border border-white/10 backdrop-blur-sm"
            style={{ 
              background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse" />
              </div>
              <code className="text-xs text-white/80 font-mono truncate flex-1">
                {message}
              </code>
            </div>
          </div>

          {/* 底部提示 */}
          <p className="text-center text-white/40 text-xs mt-8 leading-relaxed font-medium">
            首次加载可能需要 30-60 秒，请耐心等待
          </p>
        </div>
      </div>

      {/* 装饰元素 */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none animate-pulse"
        style={{ background: 'radial-gradient(circle, #d946ef, transparent)' }} 
      />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none animate-pulse"
        style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', animationDelay: '0.5s' }} 
      />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} 
      />

      {/* 闪光动画 CSS */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
