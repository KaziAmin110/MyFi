import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  PanResponder,
  Image,
  AppState,
  SafeAreaView,
} from "react-native";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTabBar } from "../../components/TabBarContext";
import {
  getSessions,
  getSessionMessages,
  sendMessage,
  ChatSession,
  ChatMessage,
} from "../../services/chat.service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.round(SCREEN_WIDTH * 0.78);

// Animated bouncing dots for thinking/typing states
const BouncingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#3059AD",
            opacity: 0.7,
            transform: [{ translateY: dot }],
          }}
        />
      ))}
    </View>
  );
};

const Chat = () => {
  const insets = useSafeAreaInsets();
  const { setVisible: setTabBarVisible } = useTabBar();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [assessmentRequired, setAssessmentRequired] = useState(false);
  const [feedbackState, setFeedbackState] = useState<{ [messageId: string]: 'like' | 'dislike' | null }>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [showThinking, setShowThinking] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;

  // Load sessions on mount

  // Refresh sessions when app returns from background (picks up cron-rotated sessions)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") loadSessions();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    setTabBarVisible(showSessions);
  }, [showSessions, setTabBarVisible]);

  useEffect(() => {
    setTabBarVisible(false);
    return () => setTabBarVisible(true);
  }, [setTabBarVisible]);

  useEffect(() => {
    Animated.spring(sidebarAnim, {
      toValue: showSessions ? 0 : -SIDEBAR_WIDTH,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [showSessions, sidebarAnim]);

  const loadSessionMessages = React.useCallback(async (session: ChatSession) => {
    try {
      setLoading(true);
      setCurrentSession(session);
      setSuggestedPrompts([]);
      setInputText("");
      const data = await getSessionMessages(session.id);

      // New session — show thinking animation before revealing the opening message
      if (data.messages.length === 1 && data.messages[0].role === "assistant") {
        setMessages([]);
        setShowThinking(true);
        setLoading(false);
        setTimeout(() => {
          setMessages(data.messages);
          setSuggestedPrompts(data.suggestedPrompts || []);
          setShowThinking(false);
        }, 1500);
        return;
      }

      setMessages(data.messages);
    } catch (error: any) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessions = React.useCallback(async () => {
    try {
      setLoading(true);
      const fetchedSessions = await getSessions();
      setSessions(fetchedSessions);

      // Auto-select most recent active session
      const activeSession = fetchedSessions.find(
        (s) => s.status === "active"
      );
      if (activeSession) {
        loadSessionMessages(activeSession);
      }
    } catch (error: any) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  }, [loadSessionMessages]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy, moveX } = gestureState;
          if (Math.abs(dy) > Math.abs(dx)) return false;
          // Swipe right from left edge to open
          if (!showSessions && moveX < 30 && dx > 20) return true;
          // Swipe left to close when open
          if (showSessions && dx < -20) return true;
          return false;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (!showSessions && gestureState.dx > 60) {
            setShowSessions(true);
          } else if (showSessions && gestureState.dx < -60) {
            setShowSessions(false);
          }
        },
      }),
    [showSessions]
  );

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  const handleCopy = async (messageId: string, content: string) => {
    await Clipboard.setStringAsync(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 1500);
  };

  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
    setFeedbackState((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === type ? null : type,
    }));
  };



  const animateSendButton = () => {
    Animated.sequence([
      Animated.timing(sendButtonScale, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.timing(sendButtonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleSendMessage = async (overrideText?: string) => {
    const messageText = (overrideText || inputText).trim();
    if (!messageText || !currentSession) return;

    animateSendButton();
    setInputText("");
    setSending(true);
    setSuggestedPrompts([]);

    const optimisticMessage: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      role: "user",
      content: messageText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const response = await sendMessage(currentSession.id, messageText);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticMessage.id),
        response.userMessage,
        response.assistantMessage,
      ]);
    } catch (error: any) {
      console.error("Error sending message:", error);

      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));

      if (error.code === "ASSESSMENT_REQUIRED") {
        setAssessmentRequired(true);
      } else {
        setInputText(messageText);
      }
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    const feedback = feedbackState[item.id];
    const isCopied = copiedMessageId === item.id;

    return (
      <View style={[styles.messageWrapper, isUser && styles.messageWrapperUser]}>
        {isUser ? (
          <View style={styles.userBubble}>
            <Text style={styles.messageText}>{item.content}</Text>
          </View>
        ) : (
          <View style={styles.assistantWrapper}>
            <Text style={styles.assistantText}>{item.content}</Text>
            <View style={styles.messageActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCopy(item.id, item.content)}
              >
                <Ionicons
                  name={isCopied ? "checkmark-done" : "copy-outline"}
                  size={16}
                  color={isCopied ? "#3059AD" : "#3D3D3D"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleFeedback(item.id, 'like')}
              >
                <Ionicons
                  name={feedback === 'like' ? "thumbs-up" : "thumbs-up-outline"}
                  size={16}
                  color={feedback === 'like' ? "#000000" : "#3D3D3D"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleFeedback(item.id, 'dislike')}
              >
                <Ionicons
                  name={feedback === 'dislike' ? "thumbs-down" : "thumbs-down-outline"}
                  size={16}
                  color={feedback === 'dislike' ? "#000000" : "#3D3D3D"}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const handlePromptSelect = (prompt: string) => {
    setInputText(prompt);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={["#3059AD", "#60B98F"]}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 0.5 }}
        locations={[0.389, 0.847]}
        style={styles.emptyGradient}
      />
      <View style={styles.emptyContent}>
        <Text style={styles.emptyTitle}>
          Hello <Text style={styles.emptyTitleGradient}>William</Text>
        </Text>
        <Text style={styles.emptySubtitleLarge}>How can I help?</Text>
        <Text style={styles.emptySubtitle}>
          Choose a prompt or start by asking a question
        </Text>
        
        <View style={styles.promptsContainer}>
          <View style={styles.promptsRow}>
            <TouchableOpacity 
              style={styles.promptButton}
              onPress={() => handlePromptSelect("Tell me more about my dominate habits")}
            >
              <Text style={styles.promptText}>Tell me more about my dominate habits</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.promptButton}
              onPress={() => handlePromptSelect("Can we talk about my upcoming events?")}
            >
              <Text style={styles.promptText}>Can we talk about my upcoming events?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promptsRow}>
            <TouchableOpacity 
              style={[styles.promptButton, styles.promptButtonCentered]}
              onPress={() => handlePromptSelect("Write a report based on my assessment results")}
            >
              <Text style={styles.promptText}>Write a report based on my assessment results</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={["#FFFFFF", "rgba(188, 209, 240, 0.4)"]}
      locations={[0.5, 1]}
      style={styles.container}
    >
      <Image
        source={require("../../assets/images/resultDisplay/topGradient.png")}
        style={styles.topGradient}
        resizeMode="stretch"
      />
      <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowSessions(true)}
            >
              <View style={styles.hamburgerIcon}>
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </View>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>
                {currentSession ? currentSession.title : "AI Coach"}
              </Text>
              {currentSession && (
                <Text style={styles.headerSubtitle}>
                  Week {new Date(currentSession.weekStartDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{" "}
                  {new Date(currentSession.weekEndDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </Text>
              )}
            </View>
            <View style={styles.headerRight} />
          </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3059AD" />
          </View>
        ) : !currentSession ? (
          renderEmptyState()
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((msg) => (
              <View key={msg.id}>{renderMessage({ item: msg })}</View>
            ))}
            {showThinking && (
              <View style={styles.typingIndicator}>
                <BouncingDots />
              </View>
            )}
            {suggestedPrompts.length > 0 && (
              <View style={styles.suggestedPromptsContainer}>
                <View style={styles.suggestedPromptsRow}>
                  {suggestedPrompts.map((prompt, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.suggestedPromptButton}
                      onPress={() => {
                        setSuggestedPrompts([]);
                        handleSendMessage(prompt);
                      }}
                    >
                      <Text style={styles.suggestedPromptText}>{prompt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {sending && (
              <View style={styles.typingIndicator}>
                <BouncingDots />
              </View>
            )}
          </ScrollView>
        )}

        {/* Input or Read-Only Banner */}
        {currentSession && (
          currentSession.isReadOnly ? (
            <View style={styles.readOnlyBanner}>
              <Ionicons name="lock-closed" size={14} color="#5D5D5D" />
              <Text style={styles.readOnlyText}>This session has ended</Text>
              <TouchableOpacity
                onPress={() => {
                  const activeSession = sessions.find(s => s.status === "active");
                  if (activeSession) loadSessionMessages(activeSession);
                }}
              >
                <Text style={styles.readOnlyLink}>Go to current session</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask MyFi..."
                placeholderTextColor="#BABABA"
                multiline
                maxLength={1000}
                editable={!sending}
              />
              <Pressable
                onPress={() => handleSendMessage()}
                disabled={!inputText.trim() || sending}
              >
                <Animated.View
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || sending) && styles.sendButtonDisabled,
                    { transform: [{ scale: sendButtonScale }] },
                  ]}
                >
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                </Animated.View>
              </Pressable>
            </View>
          )
        )}

        {/* Assessment Required Alert */}
        {assessmentRequired && (
          <View style={styles.modalOverlay}>
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>Assessment Required</Text>
              <Text style={styles.alertText}>
                Please complete the Money Habitudes assessment before starting a
                coaching chat.
              </Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setAssessmentRequired(false)}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
    </SafeAreaView>

        {/* Sessions Sidebar Overlay — outside SafeAreaView to cover status bar */}
        {showSessions && (
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => { setShowSessions(false); setShowSearch(false); setSearchQuery(""); }}
          />
        )}
        <Animated.View
          style={[
            styles.sidebar,
            { transform: [{ translateX: sidebarAnim }] },
          ]}
        >
          <View style={[styles.sidebarGradient, { paddingTop: insets.top + 12 }]}>
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarHeaderLeft}>
                <TouchableOpacity onPress={() => { setShowSessions(false); setShowSearch(false); setSearchQuery(""); }}>
                  <View style={styles.hamburgerIcon}>
                    <View style={styles.hamburgerLine} />
                    <View style={styles.hamburgerLine} />
                    <View style={styles.hamburgerLine} />
                  </View>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
                <Ionicons name="search" size={20} color="#3D3D3D" />
              </TouchableOpacity>
            </View>

            {showSearch && (
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={16} color="#8A8A8A" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search sessions..."
                  placeholderTextColor="#8A8A8A"
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={16} color="#8A8A8A" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.sessionDivider}>
              <Text style={styles.sessionDividerText}>This Week</Text>
            </View>

            <ScrollView style={styles.sessionsList}>
              {filteredSessions.length === 0 ? (
                <Text style={styles.noSessions}>{searchQuery ? "No matching sessions" : "No sessions yet"}</Text>
              ) : (
                filteredSessions.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index === 1 && !searchQuery && (
                      <View style={styles.sessionDivider}>
                        <Text style={styles.sessionDividerText}>Recent</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[
                        styles.sidebarSessionItem,
                        currentSession?.id === item.id && styles.sidebarSessionActive,
                        item.isReadOnly && styles.sidebarSessionReadOnly,
                      ]}
                      onPress={() => {
                        loadSessionMessages(item);
                        setShowSessions(false);
                        setShowSearch(false);
                        setSearchQuery("");
                      }}
                    >
                      <View style={styles.sidebarSessionRow}>
                        <Text
                          style={[
                            styles.sidebarSessionTitle,
                            currentSession?.id === item.id && styles.sidebarSessionTitleActive,
                            item.isReadOnly && styles.sidebarSessionTitleReadOnly,
                          ]}
                          numberOfLines={1}
                        >
                          {item.title}
                        </Text>
                        {item.isReadOnly && (
                          <Ionicons name="lock-closed" size={11} color="#8A8A8A" />
                        )}
                      </View>
                      <Text style={styles.sidebarSessionDate}>
                        Week of {new Date(item.weekStartDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))
              )}
            </ScrollView>
          </View>
        </Animated.View>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    height: 200,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    zIndex: 10,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  hamburgerIcon: {
    width: 19.76,
    height: 12,
    justifyContent: "space-between",
  },
  hamburgerLine: {
    width: 19.76,
    height: 2,
    backgroundColor: "#4A4949",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#5D5D5D",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    position: "relative",
  },
  emptyGradient: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: 124,
    top: -33,
    left: -8,
    borderRadius: 16,
  },
  emptyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 120,
  },
  emptyTitle: {
    fontSize: 32,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    lineHeight: 42,
  },
  emptyTitleGradient: {
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 42,
  },
  emptySubtitleLarge: {
    fontSize: 40,
    fontWeight: "400",
    color: "#000000",
    textAlign: "center",
    lineHeight: 40,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontStyle: "italic",
    fontWeight: "400",
    color: "#5D5D5D",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  promptsContainer: {
    width: "100%",
    alignItems: "center",
  },
  promptsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
    gap: 14,
  },
  promptButton: {
    width: (SCREEN_WIDTH - 64 - 14) / 2,
    height: 43,
    borderWidth: 2,
    borderColor: "#345995",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  promptButtonCentered: {
    width: (SCREEN_WIDTH - 64 - 14) / 2 + 12,
  },
  promptText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#000000",
    textAlign: "center",
    lineHeight: 15,
    letterSpacing: -0.36,
  },
  suggestedPromptsContainer: {
    marginTop: 16,
    gap: 8,
  },
  suggestedPromptsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestedPromptButton: {
    borderWidth: 1.5,
    borderColor: "#345995",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestedPromptText: {
    fontSize: 13,
    color: "#345995",
    fontWeight: "500",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    marginBottom: 20,
    alignItems: "flex-start",
  },
  messageWrapperUser: {
    alignItems: "flex-end",
  },
  userBubble: {
    maxWidth: "75%",
    alignSelf: "flex-end",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  assistantWrapper: {
    maxWidth: "90%",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 15,
    color: "#0D0D0D",
    letterSpacing: -0.3,
    lineHeight: 22,
    fontWeight: "400",
  },
  assistantText: {
    fontSize: 15,
    color: "#0D0D0D",
    letterSpacing: -0.3,
    lineHeight: 22,
    fontWeight: "400",
  },
  messageActions: {
    flexDirection: "row",
    marginTop: 8,
    gap: 14,
  },
  actionButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  readOnlyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    gap: 6,
  },
  readOnlyText: {
    fontSize: 13,
    color: "#5D5D5D",
    fontWeight: "500",
  },
  readOnlyLink: {
    fontSize: 13,
    color: "#3059AD",
    fontWeight: "600",
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 8,
    letterSpacing: -0.3,
    color: "#000000",
  },
  sendButton: {
    backgroundColor: "#3059AD",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3059AD",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: "#A0B8D8",
    shadowOpacity: 0,
    elevation: 0,
  },
  sidebarContainer: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 98,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#FFFFFF",
    zIndex: 99,
  },
  sidebarGradient: {
    flex: 1,
    paddingHorizontal: 12,
    backgroundColor: "#FAFBFE",
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  sidebarHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8ECF2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#2C2C2C",
    padding: 0,
  },
  sessionDivider: {
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sessionDividerText: {
    fontSize: 11,
    fontWeight: "400",
    color: "#5D5D5D",
    lineHeight: 20,
  },
  sessionsList: {
    flex: 1,
  },
  noSessions: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    marginTop: 20,
  },
  sidebarSessionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: "#F0F4FA",
    height: 62,
    justifyContent: "center",
  },
  sidebarSessionActive: {
    backgroundColor: "#E0EAFF",
    borderLeftWidth: 3,
    borderLeftColor: "#3059AD",
  },
  sidebarSessionReadOnly: {
    backgroundColor: "#F5F5F5",
    opacity: 0.75,
  },
  sidebarSessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sidebarSessionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 3,
    lineHeight: 18,
    flexShrink: 1,
  },
  sidebarSessionTitleActive: {
    color: "#3059AD",
    fontWeight: "700",
  },
  sidebarSessionTitleReadOnly: {
    color: "#8A8A8A",
  },
  sidebarSessionDate: {
    fontSize: 11,
    fontWeight: "400",
    color: "#8A8A8A",
    lineHeight: 16,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  alertBox: {
    backgroundColor: "#fff",
    margin: 32,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  alertText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  alertButton: {
    backgroundColor: "#3059AD",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Chat;