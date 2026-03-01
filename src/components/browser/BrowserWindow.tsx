import { useState, useEffect } from "react";
import {
	Plus,
	Mic,
	MicOff,
	Zap,
	Globe,
	TrendingUp,
	Clock,
	Sparkles,
	Activity,
	Shield,
	Radio,
	Youtube,
	Github,
	Twitter,
	Mail,
	Search,
} from "lucide-react";
import { BrowserTab } from "./BrowserTab";
import { AddressBar } from "./AddressBar";
import { NavigationControls } from "./NavigationControls";
import { ThemeSelector } from "./ThemeSelector";
import { FavoritesPanel } from "./FavoritesPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { tabService, historyService, authService } from "@/services/api";
import { WebView } from "./WebView";
import { WindowControls } from "./WindowControls";
import { voiceService } from "@/services/voiceService";
import { processVoiceQuery } from "@/services/geminiClient";

interface Tab {
	id: string;
	title: string;
	url: string;
	favicon?: string;
}

const QUICK_ACCESS = [
	{
		title: "YouTube",
		url: "youtube.com",
		icon: Youtube,
		gradient: "bg-gradient-accent",
		color: "#FF0000",
	},
	{
		title: "GitHub",
		url: "github.com",
		icon: Github,
		gradient: "bg-gradient-primary",
		color: "#181717",
	},
	{
		title: "Twitter",
		url: "twitter.com",
		icon: Twitter,
		gradient: "bg-gradient-secondary",
		color: "#1DA1F2",
	},
	{
		title: "Gmail",
		url: "gmail.com",
		icon: Mail,
		gradient: "bg-gradient-accent",
		color: "#EA4335",
	},
	{
		title: "Netflix",
		url: "netflix.com",
		icon: Zap,
		gradient: "bg-gradient-primary",
		color: "#E50914",
	},
	{
		title: "Spotify",
		url: "spotify.com",
		icon: Activity,
		gradient: "bg-gradient-accent",
		color: "#1DB954",
	},
	{
		title: "LinkedIn",
		url: "linkedin.com",
		icon: Globe,
		gradient: "bg-gradient-secondary",
		color: "#0A66C2",
	},
	{
		title: "Reddit",
		url: "reddit.com",
		icon: TrendingUp,
		gradient: "bg-gradient-primary",
		color: "#FF4500",
	},
];

const TRENDING = [
	"Últimas noticias tecnología",
	"Mejores extensiones navegador 2024",
	"Tutoriales desarrollo web",
];

const RECENT = ["orion://configuración", "github.com/orion-browser"];

// Nuevas constantes después de RECENT
const CATEGORIES = [
	{
		title: "Desarrollo",
		items: [
			{ title: "Stack Overflow", url: "stackoverflow.com", icon: "Code" },
			{ title: "MDN Web Docs", url: "developer.mozilla.org", icon: "BookOpen" },
			{ title: "DevTools", url: "orion://devtools", icon: "Wrench" },
		],
	},
	{
		title: "Productividad",
		items: [
			{ title: "Calendario", url: "calendar.google.com", icon: "Calendar" },
			{ title: "Notas", url: "keep.google.com", icon: "FileText" },
			{ title: "Drive", url: "drive.google.com", icon: "Cloud" },
		],
	},
	{
		title: "Diseño",
		items: [
			{ title: "Figma", url: "figma.com", icon: "Palette" },
			{ title: "Dribbble", url: "dribbble.com", icon: "Image" },
			{ title: "Behance", url: "behance.net", icon: "Sparkles" },
		],
	},
];

const SHORTCUTS = [
	{ key: "Ctrl+Shift+N", action: "Nueva ventana privada" },
	{ key: "Ctrl+T", action: "Nueva pestaña" },
	{ key: "Ctrl+H", action: "Historial" },
];

const NEWS_HIGHLIGHTS = [
	{
		title: "IA revoluciona el desarrollo web",
		source: "TechCrunch",
		time: "Hace 2h",
		image:
			"https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
	},
	{
		title: "Nuevo framework JavaScript 2024",
		source: "Dev.to",
		time: "Hace 4h",
		image:
			"https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=200&fit=crop",
	},
	{
		title: "Seguridad en navegadores modernos",
		source: "Wired",
		time: "Hace 6h",
		image:
			"https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&h=200&fit=crop",
	},
];

type VoiceState = "idle" | "listening" | "processing" | "results";

export const BrowserWindow = () => {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [recentSearches, setRecentSearches] = useState<string[]>([]);
	const { toast } = useToast();
	const [voiceState, setVoiceState] = useState<VoiceState>("idle");
	const [transcription, setTranscription] = useState("");
	const [audioLevels, setAudioLevels] = useState<number[]>(
		new Array(40).fill(0)
	);
	const [suggestions, setSuggestions] = useState<string[]>([]);

	useEffect(() => {
		loadTabs();
		loadRecentSearches();
	}, []);

	// Simulación de niveles de audio
	useEffect(() => {
		if (voiceState === "listening") {
			const interval = setInterval(() => {
				setAudioLevels((prev) => prev.map(() => Math.random() * 100));
			}, 100);
			return () => clearInterval(interval);
		}
	}, [voiceState]);

	const loadRecentSearches = () => {
		const stored = localStorage.getItem("orion-recent-searches");
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				setRecentSearches(parsed.slice(0, 5)); // Máximo 5 búsquedas recientes
			} catch (error) {
				console.error("Error loading recent searches:", error);
			}
		}
	};

	const saveRecentSearch = (url: string) => {
		// No guardar URLs internas de Orion
		if (url.startsWith("orion://")) return;

		setRecentSearches((prev) => {
			// Eliminar duplicados y agregar al inicio
			const filtered = prev.filter((item) => item !== url);
			const updated = [url, ...filtered].slice(0, 5); // Máximo 5

			// Guardar en localStorage
			localStorage.setItem("orion-recent-searches", JSON.stringify(updated));

			return updated;
		});
	};

	const clearRecentSearches = () => {
		setRecentSearches([]);
		localStorage.removeItem("orion-recent-searches");
		toast({
			title: "Búsquedas recientes eliminadas",
			description: "Se han borrado todas las búsquedas recientes",
		});
	};

	const loadTabs = async () => {
		if (!authService.isAuthenticated()) {
			// Si no está autenticado, crear tab por defecto
			const defaultTab: Tab = {
				id: "default",
				title: "Bienvenido a Orion",
				url: "orion://welcome",
			};
			setTabs([defaultTab]);
			setActiveTabId("default");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const data = await tabService.getTabs();

			if (data.length === 0) {
				// Crear tab inicial
				await handleNewTab();
			} else {
				setTabs(
					data.map((tab) => ({
						id: tab.id,
						title: tab.title,
						url: tab.url,
						favicon: tab.favicon || undefined,
					}))
				);
				setActiveTabId(data[0].id);
			}
		} catch (error) {
			console.error("Error loading tabs:", error);
			// Fallback a tab por defecto
			const defaultTab: Tab = {
				id: "default",
				title: "Bienvenido a Orion",
				url: "orion://welcome",
			};
			setTabs([defaultTab]);
			setActiveTabId("default");
		} finally {
			setLoading(false);
		}
	};

	const activeTab = tabs.find((tab) => tab.id === activeTabId);

	const handleNewTab = async () => {
		const tempId = `temp-${Date.now()}`;
		const newTab: Tab = {
			id: tempId,
			title: "Nueva pestaña",
			url: "orion://newtab",
		};

		setTabs([...tabs, newTab]);
		setActiveTabId(tempId);

		if (authService.isAuthenticated()) {
			try {
				const createdTab = await tabService.createTab({
					url: "orion://newtab",
					title: "Nueva pestaña",
				});

				// Reemplazar el tab temporal con el real
				setTabs((prevTabs) =>
					prevTabs.map((tab) =>
						tab.id === tempId ? { ...tab, id: createdTab.id } : tab
					)
				);
				setActiveTabId(createdTab.id);
			} catch (error) {
				console.error("Error creating tab:", error);
			}
		}

		toast({
			title: "Nueva pestaña creada",
			description: "Escribe una URL o busca algo",
		});
	};

	const handleCloseTab = async (id: string) => {
		if (tabs.length === 1) {
			await handleNewTab();
			return;
		}

		const newTabs = tabs.filter((tab) => tab.id !== id);
		setTabs(newTabs);

		if (activeTabId === id) {
			setActiveTabId(newTabs[0].id);
		}

		if (
			authService.isAuthenticated() &&
			!id.startsWith("temp-") &&
			!id.startsWith("default")
		) {
			try {
				await tabService.deleteTab(id);
			} catch (error) {
				console.error("Error deleting tab:", error);
			}
		}
	};

	const handleNavigate = async (url: string) => {
		if (!activeTab) return;

		// Normalizar la URL
		let normalizedUrl = url.trim();

		// Si no tiene protocolo y no es una URL especial de Orion
		if (
			!normalizedUrl.startsWith("http://") &&
			!normalizedUrl.startsWith("https://") &&
			!normalizedUrl.startsWith("orion://")
		) {
			// Si parece una búsqueda (tiene espacios o no tiene punto)
			if (normalizedUrl.includes(" ") || !normalizedUrl.includes(".")) {
				// Buscar en Google
				normalizedUrl = `https://www.google.com/search?q=${encodeURIComponent(
					normalizedUrl
				)}`;
			} else {
				// Agregar https:// por defecto
				normalizedUrl = `https://${normalizedUrl}`;
			}
		}

		const pageTitle = normalizedUrl.includes("://")
			? normalizedUrl.split("://")[1].split("/")[0]
			: normalizedUrl;

		const updatedTabs = tabs.map((tab) =>
			tab.id === activeTabId
				? { ...tab, url: normalizedUrl, title: pageTitle }
				: tab
		);
		setTabs(updatedTabs);

		// Guardar en búsquedas recientes
		saveRecentSearch(normalizedUrl);

		// Actualizar en backend
		if (
			authService.isAuthenticated() &&
			!activeTabId.startsWith("temp-") &&
			!activeTabId.startsWith("default")
		) {
			try {
				await tabService.updateTab(activeTabId, {
					url: normalizedUrl,
					title: pageTitle,
				});

				// Agregar al historial
				await historyService.addHistory({
					url: normalizedUrl,
					title: pageTitle,
				});
			} catch (error) {
				console.error("Error updating tab:", error);
			}
		}

		toast({
			title: "Navegando",
			description: `Cargando ${pageTitle}`,
		});
	};

	const handleRefresh = () => {
		toast({
			title: "Actualizando",
			description: "Recargando la página actual",
		});
	};

	const shouldShowWebView = (url: string) => {
		return url.startsWith("http://") || url.startsWith("https://");
	};

	const handleVoiceCommand = async () => {
		if (voiceState === "idle") {
			// Verificar soporte del navegador
			if (!voiceService.isSupported()) {
				toast({
					title: "No soportado",
					description: "Tu navegador no soporta reconocimiento de voz",
					variant: "destructive",
				});
				return;
			}

			setVoiceState("listening");
			setTranscription("Escuchando...");
			setSuggestions([]);

			voiceService.startListening(
				async (finalTranscript) => {
					// Resultado final
					setTranscription(finalTranscript);
					setVoiceState("processing");

					try {
						// Procesar con Gemini
						const result = await processVoiceQuery(finalTranscript, {
							currentUrl: activeTab?.url,
							timestamp: new Date().toISOString(),
						});

						// Mostrar sugerencias
						if (result.suggestions) {
							setSuggestions(result.suggestions);
						}

						// Hablar la respuesta
						voiceService.speak(result.response, () => {
							setVoiceState("results");

							// Ejecutar acción
							if (result.action === "navigate" && result.url) {
								handleNavigate(result.url);
							} else if (result.action === "search" && result.query) {
								handleNavigate(result.query);
							}

							// Volver a idle después de mostrar resultados
							setTimeout(() => {
								setVoiceState("idle");
								setTranscription("");
								setSuggestions([]);
							}, 3000);
						});
					} catch (error) {
						console.error("Error processing voice query:", error);
						voiceService.speak(
							"Lo siento, hubo un error procesando tu solicitud"
						);
						setVoiceState("idle");
						setTranscription("");
						toast({
							title: "Error",
							description: "No se pudo procesar tu solicitud",
							variant: "destructive",
						});
					}
				},
				(error) => {
					// Error de reconocimiento
					console.error("Voice recognition error:", error);
					setVoiceState("idle");
					setTranscription("");
					toast({
						title: "Error",
						description: "No se pudo activar el micrófono",
						variant: "destructive",
					});
				},
				(interimTranscript) => {
					// Transcripción intermedia (opcional)
					setTranscription(interimTranscript);
				}
			);
		} else {
			// Detener escucha
			voiceService.stopListening();
			voiceService.stopSpeaking();
			setVoiceState("idle");
			setTranscription("");
			setSuggestions([]);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen bg-background">
			{/* Browser Chrome */}
			<div className="bg-browser-chrome border-b border-border/50 backdrop-blur-xl">
				{/* Title Bar con drag region */}
				<div
					className="h-8 flex items-center px-3 bg-background/50"
					style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
					<div className="flex items-center gap-2 flex-1">
						<div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-teal-400" />
						<span className="text-xs font-semibold">Orion Voice Browser</span>
					</div>

					<div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
						<WindowControls />
					</div>
				</div>

				{/* Tabs Bar */}
				<div className="flex items-end gap-1 px-3 pt-2">
					{tabs.map((tab) => (
						<BrowserTab
							key={tab.id}
							{...tab}
							isActive={tab.id === activeTabId}
							onSelect={() => setActiveTabId(tab.id)}
							onClose={() => handleCloseTab(tab.id)}
						/>
					))}
					<Button
						variant="ghost"
						size="icon"
						onClick={handleNewTab}
						className="h-9 w-9 mb-1 hover:scale-110 transition-transform duration-200">
						<Plus className="h-5 w-5" />
					</Button>
				</div>

				{/* Navigation Bar - Siempre visible */}
				<div className="flex items-center gap-4 px-5 py-4">
					<NavigationControls
						canGoBack={false}
						canGoForward={false}
						onBack={() => toast({ title: "Atrás" })}
						onForward={() => toast({ title: "Adelante" })}
						onHome={() => handleNavigate("orion://welcome")}
						onMenu={() => toast({ title: "Menú", description: "Próximamente" })}
					/>

					{/* Barra de búsqueda siempre visible */}
					<div className="flex-1">
						<AddressBar
							url={activeTab?.url || ""}
							onNavigate={handleNavigate}
							onRefresh={handleRefresh}
						/>
					</div>

					<div className="flex items-center gap-2">
						<FavoritesPanel onNavigate={handleNavigate} />
						<ThemeSelector />
					</div>
				</div>
			</div>

			{/* Content Area */}
			<div className="flex-1 bg-background overflow-hidden relative">
				{activeTab && shouldShowWebView(activeTab.url) ? (
					<WebView
						url={activeTab.url}
						onLoadStart={() => console.log("Loading...")}
						onLoadStop={() => console.log("Loaded!")}
						onTitleUpdate={(title) => {
							setTabs(
								tabs.map((tab) =>
									tab.id === activeTabId ? { ...tab, title } : tab
								)
							);
						}}
						onFaviconUpdate={(favicon) => {
							setTabs(
								tabs.map((tab) =>
									tab.id === activeTabId ? { ...tab, favicon } : tab
								)
							);
						}}
						className="w-full h-full"
					/>
				) : (
					// Voice Interface con diseño mejorado y olas animadas
					<div className="h-full relative overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
						{/* Animated Ocean Waves Background - Multiple Layers */}
						<div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
							<div
								className="absolute inset-0"
								style={{
									background:
										"radial-gradient(ellipse at center, rgba(14,165,233,0.15) 0%, transparent 70%)",
								}}
							/>

							{/* Multiple Wave Layers - Horizontal Movement */}
							{[...Array(5)].map((_, i) => (
								<div
									key={i}
									className="absolute w-[200%] h-32 opacity-30"
									style={{
										bottom: `${i * 15}%`,
										left: "-50%",
										background: `linear-gradient(90deg, transparent, rgba(6,182,212,${
											0.3 - i * 0.05
										}), transparent)`,
										animation: `wave ${10 + i * 2}s ease-in-out infinite`,
										animationDelay: `${i * 0.5}s`,
										transform:
											voiceState === "listening" ? "scale(1.3)" : "scale(1)",
										transition: "transform 1s ease",
									}}
								/>
							))}

							{/* Top Wave Bar - Pulses with voice */}
							<div
								className="absolute w-full h-2"
								style={{
									top: "15%",
									left: 0,
									background:
										"linear-gradient(90deg, transparent, rgba(6,182,212,0.8), transparent)",
									boxShadow: "0 0 30px rgba(6,182,212,0.6)",
									animation:
										voiceState === "listening"
											? "wavePulse 2s ease-in-out infinite"
											: "none",
								}}
							/>
						</div>

						{/* Floating Particles - When listening */}
						{voiceState === "listening" && (
							<div className="absolute inset-0 pointer-events-none overflow-hidden">
								{[...Array(30)].map((_, i) => (
									<div
										key={i}
										className="absolute w-2 h-2 bg-cyan-400/50 rounded-full"
										style={{
											top: `${Math.random() * 100}%`,
											left: `${Math.random() * 100}%`,
											animation: `float ${
												3 + Math.random() * 4
											}s ease-in-out infinite`,
											animationDelay: `${Math.random() * 2}s`,
											filter: "blur(1px)",
										}}
									/>
								))}
							</div>
						)}

						<div className="relative max-w-7xl mx-auto py-8 px-8">
							{/* Voice Button Central con Olas Circulares Animadas */}
							<div className="flex justify-center mb-16 pt-8">
								<div className="relative">
									{/* Ripple Circles - Expanding Waves (Siri Effect) */}
									{voiceState !== "idle" &&
										[...Array(4)].map((_, i) => (
											<div
												key={i}
												className="absolute inset-0 rounded-full"
												style={{
													border: "2px solid rgba(6,182,212,0.4)",
													animation: `ripple ${2 + i * 0.5}s ease-out infinite`,
													animationDelay: `${i * 0.3}s`,
												}}
											/>
										))}

									{/* Fluid Wave Lines - Around Button */}
									{voiceState === "listening" && (
										<>
											{/* Top Wave */}
											<div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-8">
												<svg viewBox="0 0 200 20" className="w-full h-full">
													<path
														d="M0,10 Q25,0 50,10 T100,10 T150,10 T200,10"
														fill="none"
														stroke="rgba(6,182,212,0.6)"
														strokeWidth="3"
														style={{
															animation: "waveFlow 3s ease-in-out infinite",
															filter:
																"drop-shadow(0 0 8px rgba(6,182,212,0.8))",
														}}
													/>
												</svg>
											</div>

											{/* Bottom Wave */}
											<div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-8">
												<svg viewBox="0 0 200 20" className="w-full h-full">
													<path
														d="M0,10 Q25,20 50,10 T100,10 T150,10 T200,10"
														fill="none"
														stroke="rgba(6,182,212,0.6)"
														strokeWidth="3"
														style={{
															animation:
																"waveFlow 3s ease-in-out infinite reverse",
															filter:
																"drop-shadow(0 0 8px rgba(6,182,212,0.8))",
														}}
													/>
												</svg>
											</div>

											{/* Left Wave */}
											<div className="absolute -left-20 top-1/2 -translate-y-1/2 w-8 h-64">
												<svg viewBox="0 0 20 200" className="w-full h-full">
													<path
														d="M10,0 Q0,25 10,50 T10,100 T10,150 T10,200"
														fill="none"
														stroke="rgba(6,182,212,0.6)"
														strokeWidth="3"
														style={{
															animation: "waveFlow 3s ease-in-out infinite",
															animationDelay: "0.5s",
															filter:
																"drop-shadow(0 0 8px rgba(6,182,212,0.8))",
														}}
													/>
												</svg>
											</div>

											{/* Right Wave */}
											<div className="absolute -right-20 top-1/2 -translate-y-1/2 w-8 h-64">
												<svg viewBox="0 0 20 200" className="w-full h-full">
													<path
														d="M10,0 Q20,25 10,50 T10,100 T10,150 T10,200"
														fill="none"
														stroke="rgba(6,182,212,0.6)"
														strokeWidth="3"
														style={{
															animation:
																"waveFlow 3s ease-in-out infinite reverse",
															animationDelay: "0.5s",
															filter:
																"drop-shadow(0 0 8px rgba(6,182,212,0.8))",
														}}
													/>
												</svg>
											</div>
										</>
									)}

									{/* Pulsing Glow Effect */}
									{voiceState === "listening" && (
										<div
											className="absolute inset-0 rounded-full"
											style={{
												background:
													"radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)",
												animation: "glow 2s ease-in-out infinite",
												filter: "blur(20px)",
											}}
										/>
									)}

									{/* Main Voice Button */}
									<button
										onClick={handleVoiceCommand}
										className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
											voiceState === "listening"
												? "bg-gradient-to-br from-cyan-500 to-teal-400 scale-110 shadow-2xl shadow-cyan-500/50"
												: voiceState === "processing"
												? "bg-gradient-to-br from-purple-500 to-pink-400 scale-105 shadow-xl shadow-purple-500/50"
												: "bg-slate-800/80 hover:bg-slate-700/80 hover:scale-105"
										}`}
										style={{
											boxShadow:
												voiceState === "listening"
													? "0 0 60px rgba(6,182,212,0.6), inset 0 0 20px rgba(255,255,255,0.2)"
													: undefined,
										}}>
										<div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm" />
										{voiceState === "listening" ? (
											<MicOff className="w-12 h-12 text-white animate-pulse relative z-10" />
										) : voiceState === "processing" ? (
											<div className="relative z-10 w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
										) : (
											<Mic className="w-12 h-12 text-slate-300 relative z-10" />
										)}
									</button>

									{/* Audio Visualization Bars */}
									{voiceState === "listening" && (
										<div className="absolute -bottom-32 left-1/2 -translate-x-1/2 flex items-end justify-center gap-1 h-24 w-80">
											{audioLevels.map((level, i) => (
												<div
													key={i}
													className="w-1.5 bg-gradient-to-t from-cyan-500 to-teal-400 rounded-full transition-all duration-100"
													style={{
														height: `${Math.max(8, level)}%`,
														opacity: 0.7 + level / 200,
														boxShadow: "0 0 8px rgba(6,182,212,0.6)",
													}}
												/>
											))}
										</div>
									)}
								</div>
							</div>

							{/* Status Text con sugerencias de Gemini */}
							<div className="text-center mb-12">
								<p
									className={`text-2xl font-semibold transition-all duration-300 mb-2 ${
										voiceState === "listening"
											? "text-cyan-400 animate-pulse"
											: voiceState === "processing"
											? "text-purple-400"
											: "text-slate-400"
									}`}>
									{voiceState === "idle" && "Toca el micrófono para hablar"}
									{voiceState === "listening" && "Escuchando..."}
									{voiceState === "processing" && "Procesando tu solicitud..."}
									{voiceState === "results" && "✓ Listo"}
								</p>

								{transcription && voiceState !== "idle" && (
									<p className="text-lg text-cyan-300/80 max-w-md mx-auto animate-in fade-in mb-4">
										"{transcription}"
									</p>
								)}

								{/* Sugerencias de Gemini */}
								{suggestions.length > 0 && voiceState === "results" && (
									<div className="max-w-2xl mx-auto mt-6 animate-in fade-in">
										<p className="text-sm text-slate-400 mb-3">
											También podrías probar:
										</p>
										<div className="flex flex-wrap gap-2 justify-center">
											{suggestions.map((suggestion, i) => (
												<button
													key={i}
													onClick={() => handleNavigate(suggestion)}
													className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-cyan-500/50 rounded-full text-sm text-slate-300 hover:text-cyan-400 transition-all duration-300">
													{suggestion}
												</button>
											))}
										</div>
									</div>
								)}
							</div>

							{/* Búsquedas Recientes Section - Estilo de la imagen */}
							<div className="mb-12">
								<div className="flex items-center gap-3 mb-6">
									<div className="w-1 h-6 bg-cyan-500" />
									<h2 className="text-xl font-semibold text-slate-200">
										Búsquedas recientes
									</h2>
								</div>

								<div className="space-y-3">
									{[
										{ query: "¿Cómo está el clima hoy?", time: "Hace 10 min" },
										{ query: "Noticias de tecnología", time: "Hace 30 min" },
										{ query: "Resultados deportivos", time: "Hace 1 hora" },
										{ query: "Recetas saludables", time: "Hace 2 horas" },
									].map((item, i) => (
										<div
											key={i}
											onClick={() => handleNavigate(item.query)}
											className="group flex items-center gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-800/60 cursor-pointer transition-all duration-300">
											<Search className="h-5 w-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
											<div className="flex-1">
												<p className="text-slate-200 group-hover:text-cyan-400 transition-colors">
													{item.query}
												</p>
												<p className="text-sm text-slate-500">{item.time}</p>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Noticias para ti Section - Estilo de la imagen */}
							<div>
								<div className="flex items-center gap-3 mb-6">
									<div className="w-1 h-6 bg-cyan-500" />
									<h2 className="text-xl font-semibold text-slate-200">
										Noticias para ti
									</h2>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									{NEWS_HIGHLIGHTS.map((news, i) => (
										<div
											key={i}
											className="group relative overflow-hidden rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-cyan-500/50 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer">
											{/* Image placeholder */}
											<div className="aspect-video overflow-hidden bg-gradient-to-br from-cyan-900/20 to-teal-900/20">
												<div className="w-full h-full bg-gradient-to-br from-cyan-500/5 to-teal-500/5" />
												<div className="absolute inset-0 flex items-center justify-center">
													<div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center backdrop-blur-sm">
														<Globe className="h-8 w-8 text-cyan-400" />
													</div>
												</div>
											</div>

											<div className="p-5">
												<p className="text-xs text-cyan-400 mb-2 flex items-center gap-2">
													<span className="w-2 h-2 rounded-full bg-cyan-400" />
													Desliza hacia arriba para más contenido
												</p>
												<h3 className="font-semibold mb-3 text-lg text-slate-200 group-hover:text-cyan-400 transition-colors line-clamp-2">
													{news.title}
												</h3>
												<div className="flex items-center gap-2 text-sm text-slate-400">
													<span>{news.source}</span>
													<span>•</span>
													<span>{news.time}</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Quick Access Icons - Agregados para más funcionalidad */}
							<div className="mt-12">
								<div className="grid grid-cols-4 md:grid-cols-8 gap-4">
									{QUICK_ACCESS.map((item, i) => (
										<div
											key={i}
											onClick={() => handleNavigate(`https://${item.url}`)}
											className="group cursor-pointer">
											<div className="flex flex-col items-center gap-2">
												<div className="w-14 h-14 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800/50 shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-500/50 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-all duration-300">
													<item.icon className="h-6 w-6 text-slate-400 group-hover:text-cyan-400" />
												</div>
												<span className="text-xs text-slate-400 group-hover:text-cyan-400 transition-colors">
													{item.title}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* Enhanced CSS Animations */}
						<style>{`
              @keyframes wave {
                0%, 100% {
                  transform: translateX(0) translateY(0);
                }
                50% {
                  transform: translateX(25%) translateY(-15px);
                }
              }
              
              @keyframes wavePulse {
                0%, 100% {
                  opacity: 0.5;
                  transform: scaleY(1) scaleX(1);
                }
                50% {
                  opacity: 1;
                  transform: scaleY(2) scaleX(1.1);
                }
              }
              
              @keyframes ripple {
                0% {
                  transform: scale(1);
                  opacity: 0.8;
                }
                100% {
                  transform: scale(2.5);
                  opacity: 0;
                }
              }
              
              @keyframes waveFlow {
                0%, 100% {
                  d: path("M0,10 Q25,0 50,10 T100,10 T150,10 T200,10");
                }
                50% {
                  d: path("M0,10 Q25,20 50,10 T100,10 T150,10 T200,10");
                }
              }
              
              @keyframes glow {
                0%, 100% {
                  opacity: 0.5;
                  transform: scale(1);
                }
                50% {
                  opacity: 0.8;
                  transform: scale(1.2);
                }
              }
              
              @keyframes float {
                0%, 100% {
                  transform: translateY(0) translateX(0);
                  opacity: 0;
                }
                10% {
                  opacity: 1;
                }
                90% {
                  opacity: 1;
                }
                100% {
                  transform: translateY(-100px) translateX(20px);
                  opacity: 0;
                }
              }
              
              .animate-in {
                animation: fadeIn 0.5s ease-out forwards;
              }
              
              @keyframes fadeIn {
                from {
                  opacity: 0;
                  transform: translateY(10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
					</div>
				)}
			</div>
		</div>
	);
};
