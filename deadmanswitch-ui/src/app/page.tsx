import { ConnectWallet } from "@/components/ConnectWallet";
import { RegisterHeir } from "@/components/RegisterHeir";
import { DepositFunds } from "@/components/DepositFunds";
import { PingAlive } from "@/components/PingAlive";
import { VaultStatus } from "@/components/VaultStatus";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white selection:bg-purple-500/30">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-900/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="container mx-auto px-6 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="font-bold text-xl">D</span>
          </div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tighter">
            DEADMANSWITCH <span className="text-purple-500">AI</span>
          </h1>
        </div>
        <ConnectWallet />
      </header>

      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-5xl font-extrabold mb-4 tracking-tight">
            Autonomous Crypto <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-400 animate-gradient">Inheritance</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Secure your legacy. Automated off-chain monitoring and on-chain execution via Chainlink CRE.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <RegisterHeir />
              <DepositFunds />
            </div>

            <div className="bg-gradient-to-r from-purple-900/20 to-transparent p-1 rounded-2xl shadow-2xl">
              <div className="bg-[#0f0f12]/90 backdrop-blur-xl rounded-2xl p-8 border border-white/5">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  How it works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-purple-400 font-bold mb-2">01. Register</div>
                    Address your beneficiary and set an inactivity threshold (e.g., 6 months).
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-purple-400 font-bold mb-2">02. Monitor</div>
                    The CRE workflow monitors your activity off-chain. One ping keeps the switch at bay.
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-purple-400 font-bold mb-2">03. Execute</div>
                    If the threshold passes without a ping, assets are autonomously transferred.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <VaultStatus />
            <PingAlive />
          </div>
        </div>
      </div>

      <footer className="container mx-auto px-6 py-12 text-center text-gray-600 text-sm border-t border-white/5 relative z-10">
        <p>© 2026 DEADMANSWITCH AI Protocol. Hackathon Submission.</p>
      </footer>
    </main>
  );
}
