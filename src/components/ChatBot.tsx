import { useState } from "react";
import axios from "axios";

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ role: string; text: string }[]>([]);

  const sendMessage = async () => {
    const res = await axios.post("/api/chat", { message });

    setChat([...chat, 
      { role: "user", text: message },
      { role: "bot", text: res.data }
    ]);

    setMessage("");
  };

  return (
    <div style={{  fontSize: "28px", marginBottom: "10px" }}>
      <div>
        {chat.map((c, i) => (
          <div key={i}>
            <b>{c.role}:</b> {c.text}
          </div>
        ))}
      </div>

      <input 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ fontSize: "inherit" }}
      />
      <button onClick={sendMessage} style={{ fontSize: "inherit" }}>Send</button>
    </div>
  );
}