import React, { useRef, useEffect, useState } from 'react';
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

const Display = styled.div`
  width: 100vw;
  height: calc(100vh - 30px);
`

const GuacClient = (props) => {
  const displayRef = useRef(null);
  const guac = useRef(null);

  const displayObserver = useRef(
    new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      console.log(`resized display local element ${width} x ${height}`, displayRect);
      SetDisplayScale();
    })
  )

  const [displayRect, setDisplayRect] = useState({x: 0, y: 0});
  const [scaleFactor, setScaleFactor] = useState(1);

  const RemoteResize = (x, y) => {
    console.log(`remote resize ${x} x ${y}`)
    setDisplayRect(
      {
        x: x,
        y: y
      }
    );
  }

  useEffect(() => {
    console.log("display rect", displayRect);
    SetDisplayScale();
  }, [displayRect])

  const SetDisplayScale = () => {
    const localDisplayRect = displayRef.current.getBoundingClientRect();
    console.log('scaling', localDisplayRect, displayRect);
    if(displayRect.x > 0) {
      if(localDisplayRect.width >= displayRect.x && localDisplayRect.height >= displayRect.y) {
        console.log("no scaling needed");
        if(scaleFactor !== 1) {
          setScaleFactor(1);
        }
      } else {
        console.log("need to scale");
        let factor = Math.min(localDisplayRect.width / displayRect.x, localDisplayRect.height / displayRect.y);
        setScaleFactor(factor);
        //guac.current.getDisplay().scale(factor);
      }
    }
  }

  useEffect(() => {
    console.log(`updating scale ${scaleFactor}`);
    if(guac.current) {
      guac.current.getDisplay().scale(scaleFactor);
    }
  }, [scaleFactor]);

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

    // register remote resize
    guac.current.getDisplay().onresize = RemoteResize;

    // register local resize
    displayObserver.current.observe(displayRef.current);
    

    // connect
    guac.current.connect("");

    // register mouse handler
    let mouse  = new Mouse(guac.current.getDisplay().getElement());
    mouse.onmousedown = 
    mouse.onmouseup = 
    mouse.onmousemove = (mouseState) => {
      const scale = guac.current.getDisplay().getScale();
      const scaledState = new Mouse.State(
        mouseState.x / scale,
        mouseState.y / scale,
        mouseState.left,
        mouseState.middle,
        mouseState.right,
        mouseState.up,
        mouseState.down
      );
      guac.current.sendMouseState(scaledState);
    }

    // register keyboard handler
    let keyboard = new Keyboard(document);
    keyboard.onkeydown = (keysym) => {
      //console.log("keysym down", keysym);
      guac.current.sendKeyEvent(1, keysym);
    }
    keyboard.onkeyup = (keysym) => {
      //console.log("keysym up", keysym);
      guac.current.sendKeyEvent(0, keysym);
    }
  }, [])

  return (
    <div>
      <TitleBar />
      <Display
        ref={displayRef} 
      />
    </div>
  )
}

export default GuacClient;