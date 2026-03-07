import { useState, useEffect, useCallback } from "react";
import {
	Plus,
	Youtube,
	Github,
	Twitter,
	Mail,
	Zap,
	Activity,
	Globe,
	TrendingUp,
	Menu,
} from "lucide-react";
import { BrowserTab } from "./BrowserTab";
import { AddressBar } from "./AddressBar";
import { NavigationControls } from "./NavigationControls";
import { ThemeSelector } from "./ThemeSelector";
import { FavoritesPanel } from "./FavoritesPanel";
import { NewTabPage } from "./NewTabPage";
import { BrowserMenu } from "@/components/menu/MenuOrion";
import { useToast } from "@/hooks/use-toast";
import { tabService, historyService, authService } from "@/services/api";
import { WebView } from "./WebView";
import { WindowControls } from "./WindowControls";
import { voiceService } from "@/services/voiceService";
import { processVoiceQuery } from "@/services/geminiClient";
import { FocusBlockedPage } from "@/pages/FocusBlockedPage";
import { useFocusBlocker } from "@/hooks/useFocusBlocker";
import { ViewSourcePage } from "./ViewSourcePage";

interface Tab {
	id: string;
	title: string;
	url: string;
	favicon?: string;
}

type VoiceState = "idle" | "listening" | "processing" | "results";

const QUICK_ACCESS = [
	{ title: "YouTube", url: "youtube.com", icon: Youtube },
	{ title: "GitHub", url: "github.com", icon: Github },
	{ title: "Twitter", url: "twitter.com", icon: Twitter },
	{ title: "Gmail", url: "gmail.com", icon: Mail },
	{ title: "Netflix", url: "netflix.com", icon: Zap },
	{ title: "Spotify", url: "spotify.com", icon: Activity },
	{ title: "LinkedIn", url: "linkedin.com", icon: Globe },
	{ title: "Reddit", url: "reddit.com", icon: TrendingUp },
];

const DEFAULT_TAB: Tab = {
	id: "default",
	title: "Bienvenido a Orion",
	url: "orion://welcome",
};

export const BrowserWindow = () => {
	const [tabs, setTabs] = useState<Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState("");
	const [loading, setLoading] = useState(true);
	const [recentSearches, setRecentSearches] = useState<string[]>([]);
	const [voiceState, setVoiceState] = useState<VoiceState>("idle");
	const [transcription, setTranscription] = useState("");
	const [audioLevels, setAudioLevels] = useState<number[]>(
		new Array(40).fill(0),
	);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [currentZoom, setCurrentZoom] = useState(100);

	const [viewSourceHtml, setViewSourceHtml] = useState<string | null>(null);
	const [viewSourceUrl, setViewSourceUrl] = useState("");

	// ── Focus Mode state (compartido con BrowserMenu) ──
	const [focusActive, setFocusActive] = useState(false);
	const [focusTimeRemaining, setFocusTimeRemaining] = useState("");
	const [focusBlockedSites, setFocusBlockedSites] = useState<
		{ id: string; domain: string }[]
	>([]);

	// ── Declarar activeTab ANTES de useFocusBlocker ──
	const activeTab = tabs.find((t) => t.id === activeTabId);
	const isAuthenticated = authService.isAuthenticated();

	// ── Focus blocker (ahora activeTab ya existe) ──
	const { isBlocked, blockedDomain } = useFocusBlocker({
		isActive: focusActive,
		blockedSites: focusBlockedSites,
		currentUrl: activeTab?.url || "",
	});

	const { toast } = useToast();

	useEffect(() => {
		loadTabs();
		loadRecentSearches();
	}, []);

	// ...existing code... (todo el resto de hooks, handlers, etc. sin cambios)

	useEffect(() => {
		if (voiceState !== "listening") return;
		const id = setInterval(
			() => setAudioLevels((p) => p.map(() => Math.random() * 100)),
			100,
		);
		return () => clearInterval(id);
	}, [voiceState]);

	const loadRecentSearches = () => {
		try {
			const stored = localStorage.getItem("orion-recent-searches");
			if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
		} catch {
			/* ignore */
		}
	};

	const saveRecentSearch = (url: string) => {
		if (url.startsWith("orion://")) return;
		setRecentSearches((prev) => {
			const updated = [url, ...prev.filter((i) => i !== url)].slice(0, 5);
			localStorage.setItem("orion-recent-searches", JSON.stringify(updated));
			return updated;
		});
	};

	const loadTabs = async () => {
		if (!isAuthenticated) {
			setTabs([DEFAULT_TAB]);
			setActiveTabId("default");
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			const data = await tabService.getTabs();
			if (data.length === 0) {
				await handleNewTab();
			} else {
				setTabs(
					data.map((t) => ({
						id: t.id,
						title: t.title,
						url: t.url,
						favicon: t.favicon || undefined,
					})),
				);
				setActiveTabId(data[0].id);
			}
		} catch {
			setTabs([DEFAULT_TAB]);
			setActiveTabId("default");
		} finally {
			setLoading(false);
		}
	};

	const handleNewTab = async () => {
		const tempId = `temp-${Date.now()}`;
		const newTab: Tab = {
			id: tempId,
			title: "Nueva pestaña",
			url: "orion://newtab",
		};
		setTabs((prev) => [...prev, newTab]);
		setActiveTabId(tempId);

		if (isAuthenticated) {
			try {
				const created = await tabService.createTab({
					url: "orion://newtab",
					title: "Nueva pestaña",
				});
				setTabs((prev) =>
					prev.map((t) => (t.id === tempId ? { ...t, id: created.id } : t)),
				);
				setActiveTabId(created.id);
			} catch {
				/* keep temp */
			}
		}
	};

	const handleCloseTab = async (id: string) => {
		if (tabs.length === 1) {
			await handleNewTab();
			return;
		}
		const remaining = tabs.filter((t) => t.id !== id);
		setTabs(remaining);
		if (activeTabId === id) setActiveTabId(remaining[0].id);

		if (
			isAuthenticated &&
			!id.startsWith("temp-") &&
			!id.startsWith("default")
		) {
			tabService.deleteTab(id).catch(() => {});
		}
	};

	const normalizeUrl = (raw: string): string => {
		const url = raw.trim();
		if (
			url.startsWith("http://") ||
			url.startsWith("https://") ||
			url.startsWith("orion://")
		)
			return url;
		if (url.includes(" ") || !url.includes("."))
			return `https://www.google.com/search?q=${encodeURIComponent(url)}`;
		return `https://${url}`;
	};

	const handleNavigate = useCallback(
		async (url: string) => {
			if (!activeTab) return;
			const normalizedUrl = normalizeUrl(url);
			const pageTitle = normalizedUrl.includes("://")
				? normalizedUrl.split("://")[1].split("/")[0]
				: normalizedUrl;

			setTabs((prev) =>
				prev.map((t) =>
					t.id === activeTabId
						? { ...t, url: normalizedUrl, title: pageTitle }
						: t,
				),
			);
			saveRecentSearch(normalizedUrl);

			if (
				isAuthenticated &&
				!activeTabId.startsWith("temp-") &&
				!activeTabId.startsWith("default")
			) {
				try {
					await Promise.all([
						tabService.updateTab(activeTabId, {
							url: normalizedUrl,
							title: pageTitle,
						}),
						historyService.addHistory({ url: normalizedUrl, title: pageTitle }),
					]);
				} catch {
					/* silent */
				}
			}

			toast({ title: "Navegando", description: `Cargando ${pageTitle}` });
		},
		[activeTab, activeTabId, isAuthenticated, toast],
	);

	const handleRefresh = () =>
		toast({
			title: "Actualizando",
			description: "Recargando la página actual",
		});

	const handleVoiceCommand = async () => {
		if (voiceState !== "idle") {
			voiceService.stopListening();
			voiceService.stopSpeaking();
			setVoiceState("idle");
			setTranscription("");
			setSuggestions([]);
			return;
		}

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
				setTranscription(finalTranscript);
				setVoiceState("processing");
				try {
					const result = await processVoiceQuery(finalTranscript, {
						currentUrl: activeTab?.url,
						timestamp: new Date().toISOString(),
					});
					if (result.suggestions) setSuggestions(result.suggestions);
					voiceService.speak(result.response, () => {
						setVoiceState("results");
						if (result.action === "navigate" && result.url)
							handleNavigate(result.url);
						else if (result.action === "search" && result.query)
							handleNavigate(result.query);
						setTimeout(() => {
							setVoiceState("idle");
							setTranscription("");
							setSuggestions([]);
						}, 3000);
					});
				} catch {
					voiceService.speak(
						"Lo siento, hubo un error procesando tu solicitud",
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
			() => {
				setVoiceState("idle");
				setTranscription("");
				toast({
					title: "Error",
					description: "No se pudo activar el micrófono",
					variant: "destructive",
				});
			},
			(interim) => setTranscription(interim),
		);
	};

	const updateActiveTab = (field: "title" | "favicon", value: string) => {
		setTabs((prev) =>
			prev.map((t) => (t.id === activeTabId ? { ...t, [field]: value } : t)),
		);
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-screen bg-[#0a0e1a] gap-4">
				<div className="relative">
					<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 animate-pulse" />
					<div className="absolute inset-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-400 blur-lg opacity-40 animate-pulse" />
				</div>
				<div className="flex items-center gap-1.5">
					<div
						className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-bounce"
						style={{ animationDelay: "0ms" }}
					/>
					<div
						className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
						style={{ animationDelay: "150ms" }}
					/>
					<div
						className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce"
						style={{ animationDelay: "300ms" }}
					/>
				</div>
				<span className="text-xs text-slate-500">Cargando Orion...</span>
			</div>
		);
	}

	const showWebView =
		activeTab?.url.startsWith("http://") ||
		activeTab?.url.startsWith("https://");

	return (
		<div className="flex flex-col h-screen bg-[#0a0e1a] overflow-hidden">
			{/* ═══ Chrome Header ═══ */}
			<div className="bg-[#0d1117] border-b border-white/[0.06] flex-shrink-0">
				{/* Title bar (draggable) */}
				<div
					className="h-9 flex items-center px-4 bg-[#080b12]"
					style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
					<div className="flex items-center gap-2.5 flex-1">
						<div className="relative">
							<div className="w-4 h-4 rounded-md bg-gradient-to-br from-cyan-500 to-teal-400" />
							<div className="absolute inset-0 w-4 h-4 rounded-md bg-gradient-to-br from-cyan-500 to-teal-400 blur-sm opacity-40" />
						</div>
						<span className="text-[11px] font-semibold text-slate-400 tracking-wide">
							ORION
						</span>
					</div>
					<div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
						<WindowControls />
					</div>
				</div>

				{/* Tab strip */}
				<div className="flex items-end px-2 pt-1.5 gap-0.5 bg-[#0b0f18]">
					{tabs.map((tab) => (
						<BrowserTab
							key={tab.id}
							{...tab}
							isActive={tab.id === activeTabId}
							onSelect={() => setActiveTabId(tab.id)}
							onClose={() => handleCloseTab(tab.id)}
						/>
					))}

					<button
						onClick={handleNewTab}
						className="flex-shrink-0 w-8 h-8 mb-0.5 rounded-lg flex items-center justify-center text-slate-600 hover:text-cyan-400 hover:bg-white/[0.04] transition-all duration-200">
						<Plus className="h-4 w-4" />
					</button>

					<div className="flex-1" />
				</div>

				{/* Navigation + Address bar */}
				<div className="flex items-center gap-3 px-3 py-2.5 bg-[#0d1117]">
					<NavigationControls
						canGoBack={false}
						canGoForward={false}
						onBack={() => toast({ title: "Atrás" })}
						onForward={() => toast({ title: "Adelante" })}
						onHome={() => handleNavigate("orion://welcome")}
						onMenu={() => setIsMenuOpen(!isMenuOpen)}
					/>

					<div className="flex-1 min-w-0">
						<AddressBar
							url={activeTab?.url || ""}
							onNavigate={handleNavigate}
							onRefresh={handleRefresh}
						/>
					</div>

					<div className="flex items-center gap-1">
						<FavoritesPanel onNavigate={handleNavigate} />
						<ThemeSelector />

						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 border ${
								isMenuOpen
									? "bg-cyan-500/15 text-cyan-400 border-cyan-500/20"
									: "text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] border-transparent hover:border-white/[0.06]"
							}`}
							title="Menú de Orion">
							<Menu className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>

			{/* ═══ Content ═══ */}
			<div className="flex-1 overflow-hidden relative bg-[#0a0e1a]">
				{isBlocked ? (
					<FocusBlockedPage
						domain={blockedDomain || ""}
						timeRemaining={focusTimeRemaining}
						onGoBack={() => handleNavigate("orion://newtab")}
					/>
				) : activeTab?.url === "orion://view-source" && viewSourceHtml ? (
          <ViewSourcePage html={viewSourceHtml} url={viewSourceUrl} />
        ) : showWebView ? (
					<WebView
						url={activeTab!.url}
						onTitleUpdate={(title) => updateActiveTab("title", title)}
						onFaviconUpdate={(favicon) => updateActiveTab("favicon", favicon)}
						className="w-full h-full"
					/>
				) : (
					<NewTabPage
						voiceState={voiceState}
						transcription={transcription}
						audioLevels={audioLevels}
						suggestions={suggestions}
						quickAccess={QUICK_ACCESS}
						recentSearches={recentSearches}
						onVoiceCommand={handleVoiceCommand}
						onNavigate={handleNavigate}
					/>
				)}
			</div>

			{/* ═══ Browser Menu (overlay) ═══ */}
			<BrowserMenu
				isOpen={isMenuOpen}
				onClose={() => setIsMenuOpen(false)}
				onNavigate={(url) => {
					handleNavigate(url);
					setIsMenuOpen(false);
				}}
				currentUrl={activeTab?.url || ""}
				currentZoom={currentZoom}
				onZoomChange={setCurrentZoom}
				onViewSource={(html, url) => {
					setViewSourceHtml(html);
					setViewSourceUrl(url);
				}}
				onFocusChange={(active, sites, timeRemaining) => {
					setFocusActive(active);
					setFocusBlockedSites(sites);
					setFocusTimeRemaining(timeRemaining);
				}}
			/>
		</div>
	);
};
