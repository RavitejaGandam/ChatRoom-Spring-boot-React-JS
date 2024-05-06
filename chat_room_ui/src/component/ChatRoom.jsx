import React, { useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";
//import ChatRoom from './ChatRoom';
var stompClient = null;
const ChatRoom = () => {
  let [publicChat, setPublicChat] = useState([]);
  let [privateChat, setPrivateChat] = useState(new Map());
  let [tab, setTab] = useState("CHATROOM");
  let [userData, setUserData] = useState({
    username: " ",
    receiverName: " ",
    connected: false,
    message: " ",
  });
  let handleUserName = (e) => {
    let { value } = e.target;
    setUserData({ ...userData, username: value });
  };
  let registerUser = () => {
    let Sock = new SockJS("http://localhost:8080/WS");
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);

    let onConnected = () => {
      setUserData({ ...userData, connected: true });
      stompClient.subscribe("/chatroom/public", onPublicMessageReceived);
      stompClient.subscribe(
        "/user/" + userData.username + "/private",
        onPrivateMeassageReceived
      );
    };
    let onPublicMessageReceived = (payload) => {
      let payloadData = JSON.parse(payload.body);
      switch (payloadData.status) {
        case "JOIN":
          if (!privateChat.get(payloadData.senderName)) {
            privateChat.set(payloadData.senderName, []);
            setPrivateChat(new Map(privateChat));
          }
          break;
        case "MESSAGE":
          publicChat.push(payloadData);
          setPublicChat([...publicChat]);
          break;
      }
    };
    let onPrivateMeassageReceived = (payload) => {
      let payloadData = JSON.parse(payload);
      if (privateChat.get(payloadData.senderName)) {
        privateChat.get(payloadData.senderName).push(payloadData);
        setPrivateChat(new Map(privateChat));
      } else {
        let list = [];
        list.push(payloadData);
        privateChat.set(payloadData.senderName, list);
        setPrivateChat(new Map(privateChat));
      }
    };
    let onError = (error) => {
      console.log(error);
    };
  };
  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li
                onClick={() => {
                  setTab("CHATROOM");
                }}
                className={`member ${tab === "CHATROOM" && "active"}`}
              >
                ChatRoom
              </li>

              {[...privateChat.keys()].map((name, index) => (
                <li className="member" key={index}>
                  {name}
                </li>
              ))}
            </ul>
          </div>
          {tab == "CHATROOM" && (
            <div className="chat-content">
              {publicChat.map((chat, index) => (
                <li className="member" key={index}>
                  {chat.senderName !== userData.username && (
                    <div className="avatar">{chat.senderName}</div>
                  )}
                  <div className="message-data">{chat.message}</div>
                  {chat.senderName === userData.username && (
                    <div className="avatar self">{chat.senderName}</div>
                  )}
                </li>
              ))}
            </div>
          )}
          {tab !== "CHATROOM" && (
            <div className="chat-content">
              {publicChat.map((chat, index) => (
                <li className="member" key={index}>
                  {chat.senderName !== userData.username && (
                    <div className="avatar">{chat.senderName}</div>
                  )}
                  <div className="message-data">{chat.message}</div>
                  {chat.senderName === userData.username && (
                    <div className="avatar self">{chat.senderName}</div>
                  )}
                </li>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="register">
          <input
            type="text"
            id="user-name"
            placeholder="Enter your name"
            value={userData.username}
            onChange={handleUserName}
          />
          <button type="button" onClick={registerUser}>
            Connect
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
