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
import { WebView } from "./WebView";
import { WindowControls } from "./WindowControls";
import { voiceService } from "@/services/voiceService";
import { processVoiceQuery } from "@/services/geminiClient";
import { FocusBlockedPage } from "@/pages/FocusBlockedPage";
import { useFocusBlocker } from "@/hooks/useFocusBlocker";
import { ViewSourcePage } from "./ViewSourcePage";
import {
	tabService,
	historyService,
	authService,
	statsService,
} from "@/services/api";
import { tabGroupService } from "@/services/api";
import { useSearchEngine } from "@/hooks/useSearchEngine";

interface Tab {
	id: string;
	title: string;
	url: string;
	favicon?: string;
	groupId?: string;
}

type VoiceState = "idle" | "listening" | "processing" | "results";
type WorkspaceMode = "normal" | "split" | "sidebar";

// Grupos de pestañas
interface TabGroup {
	id: string;
	name: string;
	color: string;
	tabIds: string[];
	collapsed: boolean;
	savedTabs: { url: string; title: string }[];
}

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
	const { config: engineConfig } = useSearchEngine();
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

	const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("normal");
	const [secondaryUrl, setSecondaryUrl] = useState("https://www.google.com");
	const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
	const [showGroupManager, setShowGroupManager] = useState(false);

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
		loadTabGroups();
	}, []);

	useEffect(() => {
		if (voiceState !== "listening") return;
		const id = setInterval(
			() => setAudioLevels((p) => p.map(() => Math.random() * 100)),
			100,
		);
		return () => clearInterval(id);
	}, [voiceState]);

	useEffect(() => {
		if (!isAuthenticated) return;

		const interval = setInterval(() => {
			// Solo contar si la tab activa es una página web real
			if (activeTab?.url && !activeTab.url.startsWith("orion://")) {
				statsService.incrementMinutes(1).catch(() => {});
			}
		}, 60_000); // cada 60 segundos = 1 minuto

		return () => clearInterval(interval);
	}, [isAuthenticated, activeTab?.url]);

	// ── Sync: enviar stats de privacidad de Electron al backend cada 30s ──
	useEffect(() => {
		if (!isAuthenticated) return;

		const syncPrivacy = async () => {
			try {
				const electronStats = await window.electron?.getPrivacyStats?.();
				if (electronStats && electronStats.trackersBlocked > 0) {
					await statsService.syncPrivacy(
						electronStats.trackersBlocked,
						electronStats.dataSavedBytes,
					);
				}
			} catch {
				/* silent */
			}
		};

		const interval = setInterval(syncPrivacy, 30_000); // cada 30 segundos
		return () => clearInterval(interval);
	}, [isAuthenticated]);

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

	const loadTabGroups = useCallback(async () => {
		if (!isAuthenticated) return;
		try {
			const groups = await tabGroupService.getAll();
			setTabGroups(
				groups.map((g: TabGroup) => ({
					...g,
					collapsed: g.collapsed ?? false,
				})),
			);
			// Actualizar groupId en tabs locales
			const groupedTabIds = new Map<string, string>();
			for (const g of groups) {
				for (const tid of g.tabIds) {
					groupedTabIds.set(tid, g.id);
				}
			}
			setTabs((prev) =>
				prev.map((t) => ({
					...t,
					groupId: groupedTabIds.get(t.id) || undefined,
				})),
			);
		} catch {
			/* silent */
		}
	}, [isAuthenticated]);

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
		// Si el tab pertenece a un grupo, guardar su info antes de cerrarlo
		const closingTab = tabs.find((t) => t.id === id);
		if (closingTab?.groupId) {
			setTabGroups((prev) =>
				prev.map((g) =>
					g.id === closingTab.groupId
						? {
								...g,
								tabIds: g.tabIds.filter((tid) => tid !== id),
								savedTabs: [
									...(g.savedTabs || []),
									{ url: closingTab.url, title: closingTab.title },
								],
						  }
						: g,
				),
			);
		}

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

	const handleReopenGroupTab = useCallback(
		async (groupId: string, index: number) => {
			const group = tabGroups.find((g) => g.id === groupId);
			if (!group || !group.savedTabs[index]) return;
			const { url, title } = group.savedTabs[index];

			// Crear nuevo tab
			const tempId = `temp-${Date.now()}`;
			const newTab: Tab = { id: tempId, title, url, groupId };
			setTabs((prev) => [...prev, newTab]);
			setActiveTabId(tempId);

			// Quitar de savedTabs y agregar a tabIds
			setTabGroups((prev) =>
				prev.map((g) =>
					g.id === groupId
						? {
								...g,
								savedTabs: g.savedTabs.filter((_, i) => i !== index),
								tabIds: [...g.tabIds, tempId],
						  }
						: g,
				),
			);

			// Persistir en backend
			if (isAuthenticated) {
				try {
					const created = await tabService.createTab({ url, title });
					setTabs((prev) =>
						prev.map((t) => (t.id === tempId ? { ...t, id: created.id } : t)),
					);
					setActiveTabId(created.id);
					setTabGroups((prev) =>
						prev.map((g) =>
							g.id === groupId
								? {
										...g,
										tabIds: g.tabIds.map((tid) =>
											tid === tempId ? created.id : tid,
										),
								  }
								: g,
						),
					);
					tabGroupService.addTab(groupId, created.id).catch(() => {});
				} catch {
					/* keep temp */
				}
			}

			setIsMenuOpen(false);
		},
		[tabGroups, isAuthenticated],
	);

	const normalizeUrl = useCallback((raw: string): string => {
		const url = raw.trim();
		if (
			url.startsWith("http://") ||
			url.startsWith("https://") ||
			url.startsWith("orion://")
		)
			return url;
		// Multi-word → always search
		if (url.includes(" "))
			return engineConfig.searchUrl(url);
		// Has a dot → treat as domain (e.g. "youtube.com", "github.io")
		if (url.includes("."))
			return `https://${url}`;
		// Single word without dot → navigate directly as .com (e.g. "youtube" → "youtube.com")
		return `https://${url}.com`;
	}, [engineConfig]);

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
					// Extraer dominio para stats
					let domain: string | null = null;
					try {
						domain = new URL(normalizedUrl).hostname;
					} catch {
						/* no es URL válida */
					}

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
		[activeTab, activeTabId, isAuthenticated, toast, normalizeUrl],
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

	const updateTab = useCallback(
		(tabId: string, field: "title" | "favicon" | "url", value: string) => {
			setTabs((prev) =>
				prev.map((t) => (t.id === tabId ? { ...t, [field]: value } : t)),
			);
		},
		[],
	);

	const handleTabUrlChange = useCallback(
		(tabId: string, newUrl: string) => {
			updateTab(tabId, "url", newUrl);
			if (
				isAuthenticated &&
				!tabId.startsWith("temp-") &&
				!tabId.startsWith("default")
			) {
				try {
					const parsedUrl = new URL(newUrl);
					const domain = parsedUrl.hostname;
					const isSearchEngine =
						(domain.includes("google.") &&
							parsedUrl.pathname.startsWith("/search")) ||
						(domain.includes("bing.") &&
							parsedUrl.pathname.startsWith("/search")) ||
						domain === "search.yahoo.com" ||
						domain.includes("duckduckgo.com");
					if (!newUrl.startsWith("orion://") && !isSearchEngine) {
						statsService.recordVisit(domain).catch(() => {});
						historyService
							.addHistory({ url: newUrl, title: domain })
							.catch(() => {});
					}
				} catch {
					/* URL inválida */
				}
			}
		},
		[isAuthenticated, updateTab],
	);

	const handleSplitView = useCallback(() => {
		setWorkspaceMode((prev) => (prev === "split" ? "normal" : "split"));
		if (workspaceMode !== "split") {
			setSecondaryUrl("https://www.google.com");
		}
		setIsMenuOpen(false);
	}, [workspaceMode]);

	const handleSidePanel = useCallback(() => {
		setWorkspaceMode((prev) => (prev === "sidebar" ? "normal" : "sidebar"));
		if (workspaceMode !== "sidebar") {
			setSecondaryUrl("https://www.google.com");
		}
		setIsMenuOpen(false);
	}, [workspaceMode]);

	const handleCreateTabGroup = useCallback(
		async (name: string, color: string, selectedTabIds: string[] = []) => {
			const tabIds =
				selectedTabIds.length > 0
					? selectedTabIds
					: activeTabId
					? [activeTabId]
					: [];
			const group: TabGroup = {
				id: `temp-group-${Date.now()}`,
				name,
				color,
				tabIds,
				collapsed: false,
				savedTabs: [],
			};

			// Optimistic update
			setTabGroups((prev) => [...prev, group]);
			setTabs((prev) =>
				prev.map((t) =>
					tabIds.includes(t.id) ? { ...t, groupId: group.id } : t,
				),
			);

			if (isAuthenticated) {
				try {
					const created = await tabGroupService.create({ name, color, tabIds });
					// Reemplazar temp id con el real
					setTabGroups((prev) =>
						prev.map((g) =>
							g.id === group.id ? { ...created, collapsed: false } : g,
						),
					);
					setTabs((prev) =>
						prev.map((t) =>
							t.groupId === group.id ? { ...t, groupId: created.id } : t,
						),
					);
				} catch {
					/* keep optimistic */
				}
			}
		},
		[activeTabId, isAuthenticated],
	);

	const handleAddTabToGroup = useCallback(
		async (tabId: string, groupId: string) => {
			setTabGroups((prev) =>
				prev.map((g) =>
					g.id === groupId && !g.tabIds.includes(tabId)
						? { ...g, tabIds: [...g.tabIds, tabId] }
						: g,
				),
			);
			setTabs((prev) =>
				prev.map((t) => (t.id === tabId ? { ...t, groupId } : t)),
			);
			if (isAuthenticated) {
				tabGroupService.addTab(groupId, tabId).catch(() => {});
			}
		},
		[isAuthenticated],
	);

	const handleRemoveSavedTab = useCallback((groupId: string, index: number) => {
		setTabGroups((prev) =>
			prev.map((g) =>
				g.id === groupId
					? { ...g, savedTabs: g.savedTabs.filter((_, i) => i !== index) }
					: g,
			),
		);
	}, []);

	const handleRemoveTabFromGroup = useCallback(
		async (tabId: string) => {
			setTabGroups((prev) =>
				prev.map((g) => ({
					...g,
					tabIds: g.tabIds.filter((id) => id !== tabId),
				})),
			);
			setTabs((prev) =>
				prev.map((t) => (t.id === tabId ? { ...t, groupId: undefined } : t)),
			);
			if (isAuthenticated) {
				tabGroupService.removeTab(tabId).catch(() => {});
			}
		},
		[isAuthenticated],
	);

	const handleDeleteGroup = useCallback(
		async (groupId: string) => {
			setTabGroups((prev) => prev.filter((g) => g.id !== groupId));
			setTabs((prev) =>
				prev.map((t) =>
					t.groupId === groupId ? { ...t, groupId: undefined } : t,
				),
			);
			if (isAuthenticated) {
				tabGroupService.delete(groupId).catch(() => {});
			}
		},
		[isAuthenticated],
	);

	const handleToggleGroupCollapse = useCallback((groupId: string) => {
		setTabGroups((prev) =>
			prev.map((g) =>
				g.id === groupId ? { ...g, collapsed: !g.collapsed } : g,
			),
		);
	}, []);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
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
		<div className="flex flex-col h-screen bg-background overflow-hidden">
			{/* ═══ Chrome Header (unificado) ═══ */}
			<div className="bg-browser-chrome border-b border-border flex-shrink-0">
				{/* Title bar + Tab strip unificados */}
				<div
					className="flex items-end px-2 pt-1 h-12 gap-0.5 bg-[hsl(var(--browser-chrome))] overflow-hidden"
					style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
					{/* Pestañas — centro, crecen */}
					<div
						className="flex items-end gap-0.5 flex-1 overflow-x-hidden"
						style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
						{/* Tabs agrupadas */}
						{tabGroups.map((group) => {
							const groupTabs = tabs.filter((t) => t.groupId === group.id);
							if (groupTabs.length === 0) return null;
							return (
								<div key={group.id} className="flex items-end gap-0.5">
									<button
										onClick={() => handleToggleGroupCollapse(group.id)}
										className="flex items-center gap-1 px-2 py-1 mb-0.5 rounded-t-md text-[10px] font-bold transition-all"
										style={{
											backgroundColor: `${group.color}20`,
											color: group.color,
										}}>
										<span
											className="w-2 h-2 rounded-full"
											style={{ backgroundColor: group.color }}
										/>
										{group.name}
										<span className="text-[9px] opacity-60">
											{group.collapsed ? `(${groupTabs.length})` : ""}
										</span>
									</button>
									{!group.collapsed &&
										groupTabs.map((tab) => (
											<BrowserTab
												key={tab.id}
												{...tab}
												isActive={tab.id === activeTabId}
												onSelect={() => setActiveTabId(tab.id)}
												onClose={() => handleCloseTab(tab.id)}
											/>
										))}
								</div>
							);
						})}

						{/* Tabs sin grupo */}
						{tabs
							.filter((t) => !t.groupId)
							.map((tab) => (
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
							className="flex-shrink-0 w-8 h-8 mb-0.5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-hoverBg transition-all duration-200">
							<Plus className="h-4 w-4" />
						</button>

						{/* Indicador de modo workspace */}
						{workspaceMode !== "normal" && (
							<button
								onClick={() => setWorkspaceMode("normal")}
								className="flex items-center gap-1 px-2 py-1 mb-0.5 rounded-md text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all">
								✕ {workspaceMode === "split" ? "Split" : "Panel"}
							</button>
						)}
					</div>

					{/* Controles de ventana — derecha, anclados */}
					<div
						className="flex items-end gap-0.5 flex-shrink-0 pb-1.5 pl-2"
						style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
						<WindowControls />
					</div>
				</div>

				{/* Navigation + Address bar */}
				<div className="flex items-center gap-3 px-3 py-2.5 bg-browser-chrome border-t border-border">
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
									? "bg-primary/15 text-primary border-primary/20"
									: "text-muted-foreground hover:text-foreground hover:bg-hoverBg border-transparent hover:border-border"
							}`}
							title="Menú de Orion">
							<Menu className="h-4 w-4" />
						</button>
					</div>
				</div>
			</div>

			{/* ═══ Content ═══ */}
			<div className="flex-1 overflow-hidden relative bg-background">
				<div
					className={`w-full h-full flex ${
						workspaceMode === "split"
							? "flex-row"
							: workspaceMode === "sidebar"
							? "flex-row"
							: ""
					}`}>
					{/* Panel principal */}
					<div
						className={`h-full overflow-hidden relative ${
							workspaceMode === "split"
								? "w-1/2"
								: workspaceMode === "sidebar"
								? "flex-1"
								: "w-full"
						}`}>
						{isBlocked ? (
							<FocusBlockedPage
								domain={blockedDomain || ""}
								timeRemaining={focusTimeRemaining}
								onGoBack={() => handleNavigate("orion://newtab")}
							/>
						) : (
							<>
								{/* ── Un WebView persistente por cada pestaña web ──
              Se ocultan visualmente pero NUNCA se desmontan,
              así el audio/video sigue reproduciéndose en segundo plano */}
								{tabs.map((tab) => {
									const isWebTab =
										tab.url.startsWith("http://") ||
										tab.url.startsWith("https://");
									if (!isWebTab) return null;
									const isActive = tab.id === activeTabId;
									return (
										<div
											key={tab.id}
											className="absolute inset-0"
											style={{
												visibility: isActive ? "visible" : "hidden",
												pointerEvents: isActive ? "auto" : "none",
											}}>
											<WebView
												url={tab.url}
												onTitleUpdate={(title) =>
													updateTab(tab.id, "title", title)
												}
												onFaviconUpdate={(favicon) =>
													updateTab(tab.id, "favicon", favicon)
												}
												onUrlChange={(newUrl) =>
													handleTabUrlChange(tab.id, newUrl)
												}
												onNewWindow={(newUrl) =>
													handleNavigate(newUrl)
												}
												className="w-full h-full"
											/>
										</div>
									);
								})}

								{/* View Source */}
								{activeTab?.url === "orion://view-source" && viewSourceHtml && (
									<div className="absolute inset-0">
										<ViewSourcePage html={viewSourceHtml} url={viewSourceUrl} />
									</div>
								)}

								{/* Nueva pestaña / Bienvenido */}
								{!showWebView && activeTab?.url !== "orion://view-source" && (
									<div className="absolute inset-0">
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
									</div>
								)}
							</>
						)}
					</div>

					{/* Divisor + Panel secundario */}
					{workspaceMode !== "normal" && (
						<>
							<div
								className={`flex-shrink-0 ${
									workspaceMode === "split"
										? "w-[3px] bg-primary/20 hover:bg-primary/40 cursor-col-resize"
										: "w-[1px] bg-border"
								}`}
							/>
							<div
								className={`h-full overflow-hidden flex flex-col ${
									workspaceMode === "split"
										? "w-1/2"
										: "w-[320px] flex-shrink-0"
								}`}>
								<div className="flex items-center gap-2 px-2 py-1.5 bg-browser-chrome border-b border-border">
									<input
										type="text"
										defaultValue={secondaryUrl}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												const raw = (e.target as HTMLInputElement).value.trim();
												const normalized =
													raw.startsWith("http://") ||
													raw.startsWith("https://")
														? raw
														: raw.includes(".") && !raw.includes(" ")
														? `https://${raw}`
														: `https://www.google.com/search?q=${encodeURIComponent(
																raw,
														  )}`;
												setSecondaryUrl(normalized);
											}
										}}
										className="flex-1 text-xs bg-hoverBg border border-border rounded-md px-2 py-1 text-foreground placeholder-muted-foreground outline-none focus:border-primary/30"
										placeholder="URL del panel..."
									/>
									<button
										onClick={() => setWorkspaceMode("normal")}
										className="text-slate-600 hover:text-slate-300 text-xs px-1">
										✕
									</button>
								</div>
								<div className="flex-1">
									<WebView url={secondaryUrl} className="w-full h-full" />
								</div>
							</div>
						</>
					)}
				</div>
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
				currentTitle={activeTab?.title}
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
				onSplitView={handleSplitView}
				onSidePanel={handleSidePanel}
				onTabGroups={() => setShowGroupManager(true)}
				workspaceMode={workspaceMode}
				tabGroups={tabGroups}
				tabs={tabs}
				activeTabId={activeTabId}
				onCreateTabGroup={handleCreateTabGroup}
				onAddTabToGroup={handleAddTabToGroup}
				onRemoveTabFromGroup={handleRemoveTabFromGroup}
				onDeleteGroup={handleDeleteGroup}
				onSelectTab={(tabId: string) => {
					setActiveTabId(tabId);
					setIsMenuOpen(false);
				}}
				onReopenGroupTab={handleReopenGroupTab}
				onRemoveSavedTab={handleRemoveSavedTab}
			/>
		</div>
	);
};
