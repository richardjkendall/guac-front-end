import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

import { Client, WebSocketTunnel, Mouse, Keyboard } from 'guacamole-common-js';

const TitleBar = styled.div`
  width: 100vw;
  background-color: black;
  height: 30px;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  color: white;
  align-items: center;
`

const GuacClient = (props) => {

  const displayRef = useRef(null);
  const guac = useRef(null);

  useEffect(() => {
    console.log("starting....");
    
    // create guac client
    guac.current = new Client(new WebSocketTunnel("ws://localhost:8080/myapp/websocket-tunnel", true))

    // attach to canvas
    displayRef.current.appendChild(guac.current.getDisplay().getElement());
    // register error handler
    guac.current.onerror = (e) => {
      console.error("error from guac", e);
    }

    // register disconnect handler
    window.onunload = () => {
      guac.current.disconnect();
    }

    guac.current.connect("");

    // register mouse handler
    let mouse  = new Mouse(guac.current.getDisplay().getElement());
    mouse.onmousedown = 
    mouse.onmouseup = 
    mouse.onmousemove = (mouseState) => {
      guac.current.sendMouseState(mouseState);
    }

    // register keyboard handler
    let keyboard = new Keyboard(document);
    keyboard.onkeydown = (keysym) => {
      console.log("keysym down", keysym);
      guac.current.sendKeyEvent(1, keysym);
    }
    keyboard.onkeyup = (keysym) => {
      console.log("keysym up", keysym);
      guac.current.sendKeyEvent(0, keysym);
    }
  }, [])

  return (
    <div>
      <TitleBar />
      <div
        ref={displayRef} 
      />
    </div>
  )
}

export default GuacClient;