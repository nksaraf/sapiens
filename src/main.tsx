import ReactDOM from "react-dom";
import React from "react";
import { App } from "./App";
import "virtual:windi-components.css";
import "virtual:windi-utilities.css";
import "virtual:windi-devtools";
import { levaStore } from "leva";

const data = localStorage.getItem("leva-store-123");
console.log(data);
// levaStore.addData(JSON.parse(data).data);

ReactDOM.render(<App />, document.getElementById("root"));
