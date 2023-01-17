import * as React from "react";
import * as ReactDOM from "react-dom";

import Tetris from "./components/tetris";

import "./tetris.css";

ReactDOM.render(
  <Tetris boardWidth="10" boardHeight="20" />,
  document.getElementById("root")
);
