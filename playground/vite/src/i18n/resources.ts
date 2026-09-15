export const resources = {
	en: {
		translation: {
			brand: {
				name: "bluff-spoiler",
				tagline: "Particle-masked sensitive content, as a Web Component",
			},
			nav: {
				home: "Home",
				playground: "Playground",
				github: "GitHub",
			},
			theme: {
				toggle: "Toggle color theme",
				light: "Light",
				dark: "Dark",
			},
			language: {
				toggle: "Switch language",
				zh: "中文",
				en: "English",
			},
			hero: {
				badge: "Web Components · Zero dependencies · Framework agnostic",
				titleStart: "Hide sensitive text behind",
				titleHighlight: "living particles",
				titleEnd: "without breaking inline flow",
				description:
					"bluff-spoiler masks sensitive inline content with a dense, transparent field of living particles — the glyphs themselves turn invisible, so the field blends into any background. Click to reveal, click again to hide — and the masked area wraps character by character, just like ordinary text.",
				ctaPrimary: "Open playground",
				ctaSecondary: "View on GitHub",
				demoHint: "Click the masked blocks to reveal the content",
				username: "Username",
				age: "Age",
			},
			features: {
				title: "Why bluff-spoiler",
				subtitle: "Small, standard, and ready for production",
				inline: {
					title: "Truly inline & line-wrap aware",
					description:
						"The host stays display: inline. One canvas is painted per line fragment measured from getClientRects(), so paragraphs of masked content wrap naturally at every breakpoint.",
				},
				particles: {
					title: "GPU-friendly particle engine",
					description:
						"A single shared requestAnimationFrame drives every instance, with DPR-capped canvases, pre-rendered bloom sprites, IntersectionObserver pausing and prefers-reduced-motion support.",
				},
				config: {
					title: "Twelve configurable parameters",
					description:
					"Color, size, density, count, bloom, opacity, speed, drift amplitude, shape — circle, square, triangle or diamond — motion: flow up, flow down, interleaved cross streams or orbit in place, a reveal/hide fade and a per-particle breathing period. All settable via attributes or properties.",
				},
				events: {
					title: "Cancelable toggle events",
					description:
						"Listen to native click, or use toggle / reveal / hide CustomEvents with source detail. preventDefault on toggle keeps the secret hidden.",
				},
				agnostic: {
					title: "Works everywhere",
					description:
						"Standard custom element with an open shadow root. Use it in vanilla JS, React, Vue, Svelte, Angular or server-rendered markup.",
				},
				a11y: {
					title: "Accessible by default",
					description:
						"Keyboard activation with Enter/Space, aria-pressed state, role=button and an automatically managed accessible label.",
				},
			},
			shapes: {
				title: "Four particle shapes",
				subtitle: "Bloom glow available for every shape",
				clickHint: "click to reveal",
			},
			wrapping: {
				title: "Masked areas wrap with your text",
				subtitle: "Resize the viewport — the particle field reflows line by line",
				paragraph:
					"In this paragraph, the name ZHANG SAN, the passport number E12345678, the phone number +86 138-0000-0000 and the email address zhangsan@example.com are all masked with bluff-spoiler. Because the element is inline, every masked fragment participates in normal line breaking and bidirectional text flow, instead of being trapped inside a single inline-block chip.",
			},
			install: {
				title: "Install & use",
				subtitle: "Register once, then write the tag anywhere",
				npm: "Install from npm",
				import: "Import the side effect to register the element",
				html: "Or use it directly in HTML",
				eventsTitle: "Custom business logic via events",
				eventsDescription:
					"The toggle event is cancelable and carries the next state plus its source (pointer, keyboard, api).",
			},
			footer: {
				rights: "Released under the MIT License.",
				built: "Built with Web Components, Canvas & Vite",
			},
			playground: {
				title: "Live playground",
				subtitle: "Adjust every parameter and inspect the emitted events",
				controls: "Particle parameters",
				color: "Particle color",
				size: "Particle size",
				density: "Density (per 10,000px²)",
				countAuto: "Automatic count (use density)",
				count: "Particle count",
				bloom: "Bloom glow",
				opacity: "Opacity",
				speed: "Speed",
				jitter: "Drift amplitude",
				shape: "Shape",
				motion: "Motion",
				motionUp: "Flow up",
				motionDown: "Flow down",
				motionCross: "Cross streams",
				motionOrbit: "Orbit in place",
				transition: "Reveal/hide fade",
				transitionInstant: "instant",
				fade: "Breathing period",
				fadeOff: "steady",
				preview: "Live preview",
				previewHint: "Click any masked block, or use the buttons below",
				revealAll: "Reveal all",
				hideAll: "Hide all",
				wrappingTitle: "Line wrapping",
				wrappingHint: "Drag the slider to change the container width",
				containerWidth: "Container width",
				log: "Event log",
				logEmpty: "Interact with a spoiler to see toggle / reveal / hide events.",
				clear: "Clear",
				snippet: "Equivalent markup",
				shapeCircle: "circle",
				shapeSquare: "square",
				shapeTriangle: "triangle",
				shapeDiamond: "diamond",
				reset: "Reset parameters",
			},
			notFound: {
				title: "Page not found",
				back: "Back to home",
			},
		},
	},
	zh: {
		translation: {
			brand: {
				name: "bluff-spoiler",
				tagline: "以 Web Component 实现的粒子敏感信息遮罩组件",
			},
			nav: {
				home: "首页",
				playground: "演示",
				github: "GitHub",
			},
			theme: {
				toggle: "切换明暗主题",
				light: "浅色",
				dark: "深色",
			},
			language: {
				toggle: "切换语言",
				zh: "中文",
				en: "English",
			},
			hero: {
				badge: "Web Components · 零依赖 · 框架无关",
				titleStart: "用",
				titleHighlight: "动态粒子",
				titleEnd: "隐藏敏感信息，且不破坏行内文本流",
				description:
					"bluff-spoiler 用一层密集、透明的动态粒子遮盖敏感内容：文字本身完全透明，粒子与任意背景自然融合。点击显示，再次点击重新隐藏；遮罩区域会像普通文本一样逐字符自动断行。",
				ctaPrimary: "进入演示",
				ctaSecondary: "查看 GitHub",
				demoHint: "点击方块即可显示敏感内容",
				username: "用户名",
				age: "年龄",
			},
			features: {
				title: "为什么选择 bluff-spoiler",
				subtitle: "小巧、标准化、可用于生产",
				inline: {
					title: "真正的行内元素，支持断行",
					description:
						"宿主元素保持 display: inline，并通过 getClientRects() 为每一行片段绘制独立 canvas，因此被遮罩的段落会在任意断点下自然换行。",
				},
				particles: {
					title: "高性能粒子引擎",
					description:
							"页面内所有实例共享一个 requestAnimationFrame，配合 DPR 上限、预渲染发光精灵、IntersectionObserver 离屏暂停与 prefers-reduced-motion 支持。",
				},
				config: {
					title: "十二个可配置参数",
					description:
					"颜色、大小、密度、数量、发光、透明度、速度、漂移幅度、形状（圆形、方形、三角形、菱形）、运动模式（向上、向下、交错相向、原地环绕）、显隐淡入淡出时长与粒子呼吸周期，均可通过 HTML 属性或 JS 属性配置。",
				},
				events: {
					title: "可取消的切换事件",
					description:
						"既可监听原生 click，也可使用 toggle / reveal / hide 自定义事件；在 toggle 中调用 preventDefault 即可阻止内容显示。",
				},
				agnostic: {
					title: "随处可用",
					description:
						"基于标准自定义元素与 open shadow root，可在原生 JS、React、Vue、Svelte、Angular 或服务端渲染的页面中直接使用。",
				},
				a11y: {
					title: "默认可访问",
					description:
						"支持 Enter/Space 键盘激活，自动维护 role=button、aria-pressed 状态与无障碍标签。",
				},
			},
			shapes: {
				title: "四种粒子形状",
				subtitle: "每种形状都可开启发光效果",
				clickHint: "点击显示",
			},
			wrapping: {
				title: "遮罩区域随文本自动断行",
				subtitle: "调整浏览器窗口，粒子区域会逐行重排",
				paragraph:
					"在这段话中，姓名张三、护照号 E12345678、手机号 +86 138-0000-0000 与邮箱 zhangsan@example.com 都使用 bluff-spoiler 进行了遮罩。由于组件是行内元素，每个遮罩片段都会参与正常的换行与双向文本流，而不是被塞进一个无法断行的 inline-block 小方块里。",
			},
			install: {
				title: "安装与使用",
				subtitle: "注册一次，即可在任意位置使用标签",
				npm: "从 npm 安装",
				import: "导入包以自动注册自定义元素",
				html: "或直接在 HTML 中使用",
				eventsTitle: "通过事件添加自定义业务逻辑",
				eventsDescription:
					"toggle 事件可取消，并携带即将进入的状态与触发来源（pointer、keyboard、api）。",
			},
			footer: {
				rights: "基于 MIT 许可证开源。",
				built: "基于 Web Components、Canvas 与 Vite 构建",
			},
			playground: {
				title: "实时演示",
				subtitle: "调整全部参数，并查看组件发出的事件",
				controls: "粒子参数",
				color: "粒子颜色",
				size: "粒子大小",
				density: "密度（每 10,000 平方像素）",
				countAuto: "自动数量（按密度计算）",
				count: "粒子数量",
				bloom: "发光效果",
				opacity: "透明度",
				speed: "速度",
				jitter: "漂移幅度",
				shape: "形状",
				motion: "运动模式",
				motionUp: "向上流动",
				motionDown: "向下流动",
				motionCross: "交错相向",
				motionOrbit: "原地环绕",
				transition: "显隐过渡",
				transitionInstant: "瞬切",
				fade: "呼吸周期",
				fadeOff: "常亮",
				preview: "实时预览",
				previewHint: "点击任意遮罩块，或使用下方按钮",
				revealAll: "全部显示",
				hideAll: "全部隐藏",
				wrappingTitle: "自动断行",
				wrappingHint: "拖动滑块改变容器宽度",
				containerWidth: "容器宽度",
				log: "事件日志",
				logEmpty: "与遮罩块交互，查看 toggle / reveal / hide 事件。",
				clear: "清空",
				snippet: "等价的标签写法",
				shapeCircle: "圆形",
				shapeSquare: "方形",
				shapeTriangle: "三角形",
				shapeDiamond: "菱形",
				reset: "重置参数",
			},
			notFound: {
				title: "页面不存在",
				back: "返回首页",
			},
		},
	},
} as const;
