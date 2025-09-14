import GuyFawkesMask from "@/components/GuyFawkesMask";
import MatrixRain from "@/components/MatrixRain";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Matrix Rain Background */}
      <MatrixRain className="z-0" />
      {/* Header */}
      <header className="flex justify-center items-center py-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Anonymous Interface
          </h1>
          <p className="text-gray-400 text-lg font-mono">
            Remember, Remember
          </p>
        </div>
      </header>

      {/* Main Content with Anonymous Mask */}
      <main className="flex flex-col items-center justify-center px-8 relative z-10">
        <div className="mb-8 w-full max-w-4xl">
          <GuyFawkesMask />
        </div>

        {/* Chat Interface */}
        <ChatInterface />

        {/* Action Buttons */}
        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <a
            className="rounded-full border border-green-500/50 bg-green-500/10 backdrop-blur-sm transition-all flex items-center justify-center text-green-400 gap-2 hover:bg-green-500/20 hover:border-green-400 font-medium text-sm sm:text-base h-12 px-6"
            href="#explore"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Explore Interface
          </a>
          <a
            className="rounded-full border border-cyan-500/50 bg-cyan-500/10 backdrop-blur-sm transition-all flex items-center justify-center text-cyan-400 gap-2 hover:bg-cyan-500/20 hover:border-cyan-400 font-medium text-sm sm:text-base h-12 px-6"
            href="#systems"
          >
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            System Access
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-8 flex gap-6 flex-wrap items-center justify-center text-gray-500 text-sm relative z-10">
        <a
          className="flex items-center gap-2 hover:text-green-400 transition-colors duration-200"
          href="#learn"
        >
          <div className="w-4 h-4 border border-current rounded-sm flex items-center justify-center">
            <div className="w-1 h-1 bg-current rounded-full"></div>
          </div>
          Neural Network
        </a>
        <a
          className="flex items-center gap-2 hover:text-cyan-400 transition-colors duration-200"
          href="#systems"
        >
          <div className="w-4 h-4 border border-current rounded-sm flex items-center justify-center">
            <div className="w-1 h-1 bg-current rounded-full"></div>
          </div>
          Cyber Systems
        </a>
        <a
          className="flex items-center gap-2 hover:text-green-400 transition-colors duration-200"
          href="#matrix"
        >
          <div className="w-4 h-4 border border-current rounded-sm flex items-center justify-center">
            <div className="w-1 h-1 bg-current rounded-full"></div>
          </div>
          Enter Matrix →
        </a>
      </footer>
    </div>
  );
}
