import React, { useState, useEffect, useRef } from "react";
import { Tv, Users, Heart, Send, ShoppingBag, X, Star, Shield, ArrowRight } from "lucide-react";
import { Product } from "../types";
import { getOptimizedImageUrl } from "../utils/imageOptimizer";
import { safeJson } from "../lib/utils";

interface LiveCommerceProps {
  user: any;
  products: Product[];
  formatCurrency: (value: number) => string;
  onBuyProduct: (productId: string, quantity: number) => void;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  content: string;
}

export default function LiveCommerce({ user, products, formatCurrency, onBuyProduct }: LiveCommerceProps) {
  const [streams, setStreams] = useState<any[]>([]);
  const [activeStream, setActiveStream] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newComment, setNewComment] = useState("");
  const [hearts, setHearts] = useState<{ id: number; style: React.CSSProperties }[]>([]);
  const [streamTitle, setStreamTitle] = useState("");
  const [featuredProductId, setFeaturedProductId] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto comments library for immersive simulation
  const mockComments = [
    { senderName: "Koffi Mensah", senderRole: "BUYER", content: "Wax de très grande qualité ! Est-ce que le stock est limité ?" },
    { senderName: "Afi Lawson", senderRole: "BUYER", content: "Le prix de gros est vraiment avantageux, je vais commander 10 pièces" },
    { senderName: "Folly G.", senderRole: "BUYER", content: "Livraison rapide vers Hedzranawoé possible ?" },
    { senderName: "Amivi T.", senderRole: "BUYER", content: "Super live ! Merci pour les explications sur la qualité" },
    { senderName: "Yaovi K.", senderRole: "BUYER", content: "Le séquestre LGF me rassure beaucoup pour cet achat" },
    { senderName: "Ets Lawson", senderRole: "VENDOR", content: "Nous expédions dès aujourd'hui !" }
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch streams from backend
  const fetchStreams = async () => {
    try {
      const res = await fetch("/api/livestreams");
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data)) {
          setStreams(data);
          
          // If we are vendor and there is an active stream, set it
          if (user && user.role === "VENDOR") {
            const myLive = data.find((s: any) => s.vendorId === user.id);
            if (myLive) {
              setActiveStream(myLive);
              setIsLive(true);
            }
          }
        }
      }
    } catch (e) {
      console.warn("Notice: fetchStreams failed", e);
    }
  };

  useEffect(() => {
    fetchStreams();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchStreams();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch chat messages when a stream is viewed
  useEffect(() => {
    if (!activeStream) return;

    const fetchChat = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/livestreams/${activeStream.id}/messages`);
        if (res.ok) {
          const data = await safeJson(res);
          if (Array.isArray(data)) {
            const mapped = data.map((msg: any) => ({
              id: msg.id,
              senderName: msg.sender?.name || "Anonyme",
              senderRole: msg.sender?.role || "BUYER",
              content: msg.content
            }));
            setChatMessages(mapped);
          }
        }
      } catch (e) {
        console.warn("Notice: fetchChat failed", e);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [activeStream]);

  // Handle auto-simulated chat comments when viewing or running a stream
  useEffect(() => {
    if (!activeStream) return;

    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const randComment = mockComments[Math.floor(Math.random() * mockComments.length)];
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + Math.random(),
          senderName: randComment.senderName,
          senderRole: randComment.senderRole,
          content: randComment.content
        }
      ].slice(-30)); // Keep last 30
      
      // Floating heart simulation automatically
      if (Math.random() > 0.4) {
        spawnHeart();
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [activeStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const spawnHeart = () => {
    const id = Date.now() + Math.random();
    const newHeart = {
      id,
      style: {
        left: `${Math.floor(Math.random() * 60) + 20}%`,
        animationDuration: `${Math.floor(Math.random() * 2) + 2}s`
      }
    };
    setHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 3000);
  };

  // Start stream
  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamTitle) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("lgf_token");
      const res = await fetch("/api/livestreams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: streamTitle,
          url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800" // Artistic background representation
        })
      });
      const data = await res.json();
      if (res.ok) {
        setIsLive(true);
        setActiveStream(data.stream);
        setStreamTitle("");
        fetchStreams();
      } else {
        alert(data.error || "Impossible de lancer le live.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  // End stream
  const handleEndLive = async () => {
    if (!activeStream) return;
    setLoading(true);

    try {
      const token = localStorage.getItem("lgf_token");
      const res = await fetch(`/api/livestreams/${activeStream.id}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setIsLive(false);
        setActiveStream(null);
        setChatMessages([]);
        fetchStreams();
      }
    } catch (err) {
      alert("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  };

  // Submit comment
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeStream) return;

    const commentText = newComment;
    setNewComment("");

    // optimistic update
    setChatMessages((prev) => [
      ...prev,
      {
        id: "temp-" + Date.now(),
        senderName: user ? user.name : "Acheteur Lomé",
        senderRole: user ? user.role : "BUYER",
        content: commentText
      }
    ]);

    try {
      const token = localStorage.getItem("lgf_token");
      await fetch(`/api/livestreams/${activeStream.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const featuredProduct = products.find((p) => p.id === featuredProductId || p.vendorId === activeStream?.vendorId);

  return (
    <div id="live-commerce" className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-100/50 pb-5">
        <div>
          <h2 className="text-lg font-bold text-emerald-950 font-display flex items-center">
            <Tv className="w-5 h-5 mr-2 text-emerald-600" />
            Lomé Live Commerce 🇹🇬
          </h2>
          <p className="text-xs text-emerald-600">
            Achetez des articles présentés en vidéo direct avec la sécurité séquestre LGF.
          </p>
        </div>

        {user && user.role === "VENDOR" && !isLive && (
          <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-2xl flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono">Prêt à diffuser</span>
          </div>
        )}
      </div>

      {/* VENDOR INTERFACE (START STREAM) */}
      {user && user.role === "VENDOR" && !isLive && (
        <form onSubmit={handleStartLive} className="bg-white p-6 rounded-3xl border border-emerald-100/50 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-emerald-950 font-display">Lancer votre diffusion en direct</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">
            Présentez vos pagnes Wax, produits cosmétiques, ou paniers de légumes d'Assigamé aux acheteurs de Lomé à Kara.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-emerald-700 uppercase">Titre du direct :</label>
              <input
                type="text"
                required
                placeholder="Ex: Arrivage Wax Hollandais Lomé Grand Marché"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-emerald-700 uppercase font-mono">Article Vedette :</label>
              <select
                value={featuredProductId}
                onChange={(e) => setFeaturedProductId(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none cursor-pointer"
              >
                <option value="">-- Sélectionner un article à mettre en avant --</option>
                {products
                  .filter((p) => p.vendorId === user.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({formatCurrency(p.price)})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            {loading ? "Préparation..." : "Lancer le Live Stream 🎥"}
          </button>
        </form>
      )}

      {/* STREAMS LIST FOR BUYERS */}
      {!activeStream && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono">Directs en cours à Lomé</h3>
          {streams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-emerald-100/50">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-100/50 mb-3 animate-pulse">
                <Tv className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-emerald-600">Aucun live en cours pour le moment.</p>
              <p className="text-[10px] text-emerald-500">Les vendeurs d'Assigamé ou Kara n'ont pas encore démarré de diffusion.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {streams.map((str) => (
                <div 
                  key={str.id} 
                  onClick={() => setActiveStream(str)}
                  className="bg-white rounded-3xl overflow-hidden border border-emerald-100/50 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer group"
                >
                  <div className="relative h-40 bg-emerald-950 flex items-center justify-center">
                    <img 
                      src={getOptimizedImageUrl(str.url, 600, 70)} 
                      alt={str.title} 
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center space-x-1 border border-rose-500 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      <span>En Direct</span>
                    </div>

                    <div className="absolute top-3 right-3 bg-emerald-950/90 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
                      <Users className="w-3 h-3 text-emerald-400" />
                      <span>{str.viewers} spectateurs</span>
                    </div>

                    <div className="w-10 h-10 bg-white/25 rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform z-10">
                      <Tv className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-emerald-950">
                    <h4 className="text-xs font-extrabold line-clamp-1 group-hover:text-emerald-700 transition-colors">{str.title}</h4>
                    <span className="text-[10px] text-emerald-500 block font-semibold uppercase font-mono">
                      Vendeur : {str.vendor?.name || "Boutique LGF"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE IMMERSIVE STREAM SCREEN */}
      {activeStream && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* STREAM VIDEO PLAYER CONTAINER (Simulated) */}
          <div className="lg:col-span-8 bg-emerald-950 rounded-3xl overflow-hidden border border-emerald-900 shadow-2xl relative h-[420px] flex flex-col justify-between p-5 text-white">
            {/* Overlay simulation elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-emerald-950/90 pointer-events-none"></div>

            <img 
              src={getOptimizedImageUrl(activeStream.url, 800, 70)} 
              alt="Live Screen Background" 
              loading="eager"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover opacity-35 z-0"
            />

            {/* Top header overlay */}
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center space-x-3">
                <div className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-full flex items-center space-x-1 border border-rose-500 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  <span>LIVE</span>
                </div>
                <div>
                  <h4 className="text-xs font-black drop-shadow-md">{activeStream.title}</h4>
                  <span className="text-[9px] text-emerald-300 font-bold block uppercase tracking-wider font-mono">
                    Par {activeStream.vendor?.name || "Boutique Lomé"}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="bg-emerald-950/90 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-xl flex items-center space-x-1 border border-emerald-800 shadow-sm">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{activeStream.viewers} spectateurs</span>
                </span>

                <button 
                  onClick={() => {
                    if (user && user.role === "VENDOR" && user.id === activeStream.vendorId) {
                      handleEndLive();
                    } else {
                      setActiveStream(null);
                      setChatMessages([]);
                    }
                  }}
                  className="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center border border-white/10 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Simulated Live Action with Floating Hearts */}
            <div className="relative h-40 z-10 flex items-center justify-center">
              <div className="absolute right-6 bottom-4 flex flex-col items-center">
                <div className="relative h-48 w-20 overflow-hidden pointer-events-none">
                  {hearts.map((h) => (
                    <div 
                      key={h.id} 
                      style={h.style} 
                      className="absolute bottom-0 text-red-500 text-lg animate-float-heart"
                    >
                      ❤️
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={spawnHeart}
                  className="w-12 h-12 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-600/30 border border-rose-400 cursor-pointer active:scale-90 transition-transform"
                >
                  <Heart className="w-6 h-6 fill-white" />
                </button>
              </div>
            </div>

            {/* Featured product floating card */}
            <div className="z-10 bg-slate-900/90 border border-white/20 rounded-2xl p-3 flex items-center justify-between gap-3 max-w-md shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-emerald-950 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                  <img 
                    src={getOptimizedImageUrl(featuredProduct?.image, 200, 65)} 
                    alt="Featured Product" 
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[9px] font-black text-yellow-400 block uppercase font-mono tracking-wider">🎯 Article en Direct</span>
                  <h5 className="text-[11px] font-bold text-white line-clamp-1">{featuredProduct?.title || "Wax Traditionnel de Qualité"}</h5>
                  <span className="text-[11px] font-black text-white font-mono">{formatCurrency(featuredProduct?.price || 12500)}</span>
                </div>
              </div>

              {user?.role !== "VENDOR" && (
                <button
                  onClick={() => {
                    if (featuredProduct) {
                      onBuyProduct(featuredProduct.id, 1);
                      setActiveStream(null);
                      setChatMessages([]);
                    } else {
                      alert("Veuillez sélectionner un article dans le catalogue.");
                    }
                  }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-emerald-950 font-black px-3 py-1.5 rounded-xl text-[10px] uppercase shadow-md transition-colors cursor-pointer flex items-center whitespace-nowrap"
                >
                  Acheter <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              )}
            </div>
          </div>

          {/* STREAM CHAT COMMENTS LIST */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-emerald-100/50 shadow-xl flex flex-col justify-between overflow-hidden h-[420px]">
            <div className="p-4 border-b border-emerald-50 bg-emerald-50/20">
              <span className="text-[10px] font-bold text-emerald-800 uppercase font-mono block">Chat du Live en Direct</span>
            </div>

            {/* Comments scroll container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center py-10 text-emerald-500 italic text-xs">
                  Aucun message. Soyez le premier à commenter !
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="text-xs space-y-0.5">
                    <span className={`font-black uppercase tracking-tighter text-[9px] block ${
                      msg.senderRole === "VENDOR" ? "text-amber-600 font-extrabold" : "text-emerald-700"
                    }`}>
                      {msg.senderName} {msg.senderRole === "VENDOR" ? "• Vendeur" : ""}
                    </span>
                    <p className="text-emerald-950 font-medium leading-relaxed bg-emerald-50/50 rounded-xl px-2.5 py-1.5 border border-emerald-100/10">
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Comment write field */}
            <form onSubmit={handleSendComment} className="p-3 border-t border-emerald-50 flex gap-2">
              <input
                type="text"
                placeholder="Votre message (wax, livraison)..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl text-xs text-emerald-950 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSS Animation injection for Hearts floating up */}
      <style>{`
        @keyframes floatHeart {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-250px) scale(1.2) rotate(15deg);
            opacity: 0;
          }
        }
        .animate-float-heart {
          animation-name: floatHeart;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
