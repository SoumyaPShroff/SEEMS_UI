import { useState } from "react";
import axios from "axios";

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    const res = await axios.post("/api/chat", { message });

    setChat([...chat, 
      { role: "user", text: message },
      { role: "bot", text: res.data }
    ]);

    setMessage("");
  };

  return (
    <div>
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
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}