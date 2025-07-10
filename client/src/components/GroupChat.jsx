import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const GroupChat = ({ selectedGroup }) => {
  const [user] = useAuthState(auth);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedGroup) return;
    const q = query(
      collection(db, "groups", selectedGroup.id, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => doc.data());
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || !selectedGroup) return;

    await addDoc(collection(db, "groups", selectedGroup.id, "messages"), {
      text: input,
      sender: user.uid,
      senderName: user.displayName || "Anonymous",
      timestamp: serverTimestamp(),
    });

    setInput("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px] border rounded-lg shadow-md bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white px-5 py-3 font-semibold text-lg">
        💬 Group Chat
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50">
        {messages.map((msg, idx) => {
          const isCurrentUser = msg.sender === user?.uid;
          return (
            <div
              key={idx}
              className={`mb-4 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg p-3 shadow text-sm ${
                  isCurrentUser
                    ? "bg-blue-500 text-white text-right"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <div className="font-semibold text-xs mb-1">
                  {msg.senderName || "User"}
                </div>
                <div>{msg.text}</div>
                {msg.timestamp?.toDate && (
                  <div className="text-[10px] text-gray-300 mt-1">
                    {new Date(msg.timestamp.toDate()).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t bg-white px-4 py-3 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GroupChat;
