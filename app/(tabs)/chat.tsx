// 1) Install AsyncStorage if needed: "expo install @react-native-async-storage/async-storage"
// 2) Import AsyncStorage.
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {useState, useRef, useEffect} from "react";
import {
    SafeAreaView,
    StyleSheet,
    View,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator, Alert,
} from "react-native";
import {TextInput, IconButton, Menu} from "react-native-paper";
import {runGemini} from "@/utility/useGemini";
import Markdown from "react-native-markdown-display";
import {useSettings} from "@/utility/SettingsContext";

const MESSAGES_STORAGE_KEY = "@chat_messages"; // 3) Change key if you want a different name.

export default function ChatScreen() {
    const {user} = useSettings();
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef(null);
    const [menuVisible, setMenuVisible] = useState<number | null>(null);
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    // 4) Load history on mount.
    useEffect(() => {
        loadMessages();
    }, []);

    // 5) Every time messages change, store them.
    useEffect(() => {
        storeMessages(messages);
    }, [messages]);

    // 6) Load from AsyncStorage (only last 20).
    const loadMessages = async () => {
        try {
            const stored = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
            if (stored) {
                setMessages(JSON.parse(stored));
            }
        } catch (error) {
            console.warn("Error loading messages:", error);
        }
    };

    // 7) Store to AsyncStorage.
    const storeMessages = async (msgs) => {
        try {
            await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(msgs));
        } catch (error) {
            console.warn("Error storing messages:", error);
        }
    };

    // 8) Send message, append, limit array to last 20, then run Gemini.
    const handleSendMessage = async () => {
        if (!userInput.trim()) return;
        const newMsg = {id: Date.now().toString(), content: userInput, role: "user"};
        const updated = [...messages, newMsg].slice(-20); // keep last 20
        setMessages(updated);
        setUserInput("");
        setLoading(true);
        const geminiReply = await runGemini(userInput);
        if (geminiReply) {
            const replyMsg = {id: Date.now().toString(), content: geminiReply, role: "model"};
            setMessages((prev) => [...prev, replyMsg].slice(-20)); // keep last 20
        }
        setLoading(false);
    };

    const handleReport = (item) => {
        // Remove the reported message from the list
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== item.id));

        // Show a confirmation alert
        Alert.alert(
            "Message Reported",
            "The message has been removed and reported.",
            [{text: "OK"}]
        );

        // Hide the menu
        setMenuVisible(null);
    };


    // 9) Render bubbles without repeated indicators.
    const renderMessage = ({item}) => {
        const isUser = item.role === "user";
        return (
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.modelBubble]}>
                <Markdown style={markdownStyles}>{item.content}</Markdown>
                {!isUser && (
                    <View style={styles.menuContainer}>
                        <Menu
                            visible={menuVisible === item}
                            onDismiss={() => setMenuVisible(null)}
                            anchor={
                                <IconButton
                                    icon="dots-horizontal"
                                    size={20}
                                    onPress={() => setMenuVisible(item)}
                                    style={styles.menuButton}
                                />
                            }
                        >
                            <Menu.Item onPress={() => handleReport(item)} title="Report"/>
                            <Menu.Item onPress={() => setMenuVisible(null)} title="Cancel"/>
                        </Menu>
                    </View>
                )}
            </View>
        );
    };

    // 10) Utility for scrolling to bottom.
    useEffect(() => {
        if (messages.length) {
            flatListRef.current?.scrollToEnd({animated: true});
        }
    }, [messages]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <View style={styles.container}>
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(msg) => msg.id}
                        renderItem={renderMessage}
                        style={styles.list}
                        contentContainerStyle={styles.listContent}
                    />
                    {loading && <ActivityIndicator size="large" color="#0000ff"/>}
                    <View style={styles.inputContainer}>
                        <TextInput
                            mode="outlined"
                            style={styles.input}
                            placeholder="Type your message..."
                            value={userInput}
                            onChangeText={setUserInput}
                            onSubmitEditing={handleSendMessage}
                        />
                        <IconButton
                            icon="send"
                            size={24}
                            onPress={handleSendMessage}
                            style={styles.sendButton}
                        />
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// 11) Adjust styles/markdownStyles as desired.
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F5F5F5",
    },
    container: {
        flex: 1,
    },
    list: {
        flex: 1,
        marginBottom: 40,
    },
    listContent: {
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 8,
        backgroundColor: "#FFF",
        borderTopWidth: 1,
        borderTopColor: "#ccc",
        bottom: 50,
    },
    messageBubble: {
        marginVertical: 4,
        padding: 10,
        borderRadius: 8,
        maxWidth: "85%",
    },
    userBubble: {
        alignSelf: "flex-end",
        backgroundColor: "#DCF8C6",
    },
    modelBubble: {
        alignSelf: "flex-start",
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#EEE",
    },
    input: {
        flex: 1,
        marginRight: 6,
    },
    sendButton: {
        marginLeft: 4,
    },
    menuContainer: {
        position: 'absolute',      // 1) Absolutely position the menu anchor
        bottom: 0,                 // 2) Keep it at the bottom
        right: 0,                  // 2) Align to the right
    },
    menuButton: {
        margin: 0,  // No margin so it snugly fits in the bottom-right corner
    },
});

const markdownStyles = StyleSheet.create({
    body: {color: "#000"},
    heading1: {fontSize: 24, fontWeight: "bold", marginBottom: 8},
    heading2: {fontSize: 20, fontWeight: "bold", marginTop: 8, marginBottom: 8},
    bullet_list: {marginBottom: 10},
    ordered_list: {marginBottom: 10},
    bullet_list_item: {flexDirection: "row", marginBottom: 5},
    ordered_list_item: {flexDirection: "row", marginBottom: 5},
    bullet: {marginRight: 10},
    list_item_content: {flex: 1},
    strong: {fontWeight: "bold"},
    text: {color: "#000"},
});
