import React from "react";

export default function Loader() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-bounce" />
        <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-.2s]" />
        <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-.4s]" />
      </div>
    </div>
  );
}
