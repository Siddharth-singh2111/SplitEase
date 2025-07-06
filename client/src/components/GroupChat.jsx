import React, { useEffect, useRef, useState } from "react";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from "firebase/firestore";
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
    <div className="mt-6 p-4 bg-white shadow-md rounded-md border">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        💬 Group Chat
      </h3>
      <div className="h-64 overflow-y-auto bg-gray-50 p-3 rounded mb-4 border border-gray-200">
        {messages.map((msg, idx) => {
          const isCurrentUser = msg.sender === user.uid;
          return (
            <div
              key={idx}
              className={`flex flex-col mb-3 ${
                isCurrentUser ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg shadow-sm ${
                  isCurrentUser
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                <div className="text-xs font-semibold mb-1">
                  {msg.senderName || "User"}
                </div>
                <div className="text-sm">{msg.text}</div>
              </div>
              {msg.timestamp?.toDate && (
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(msg.timestamp.toDate()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GroupChat;
