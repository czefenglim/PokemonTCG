'use client';

import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import nftAbi from '@/lib/data/pokemonCardABI.json';
import tradeAbi from '@/lib/data/tradeCardABI.json';
import { use } from 'chai';

export default function TradeCardsPage() {
  const [loading, setLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [isProcessing, setIsProcessing] = useState(false);

  const [address, setAddress] = useState<string | null>(null);

  const router = useRouter();

  const nftAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;
  const tradeContractAddress = process.env.NEXT_PUBLIC_TRADE_CONTRACT as string;

  const [isRejecting, setIsRejecting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleTradeClick = () => {
    router.push('/user/tradeCards/selectFriend');
  };

  const loadTradeCards = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask.');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);

      await fetchTradeRequests(userAddress);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTradeCards();
  }, []);

  useEffect(() => {
    const fetchCardImage = async () => {
      if (!selectedRequest) return;

      let cardIdToLoad;

      if (selectedRequest.type === 'received') {
        cardIdToLoad = selectedRequest.offeredCardId;
      } else if (
        selectedRequest.type === 'sent' &&
        selectedRequest.receiverStatus === 'accepted'
      ) {
        cardIdToLoad = selectedRequest.requestedCardId;
      } else {
        cardIdToLoad = selectedRequest.offeredCardId;
      }

      if (!cardIdToLoad || selectedRequest.cardImageUrl) return;

      try {
        const res = await fetch(
          `/api/tradeRequest/getOfferedCardImage/${cardIdToLoad}`
        );
        const data = await res.json();

        setSelectedRequest((prev: any) => {
          if (prev.cardImageUrl) return prev;
          return {
            ...prev,
            cardImageUrl: data.imageUrl,
          };
        });
      } catch (err) {
        console.error('Failed to load card image:', err);
      }
    };

    fetchCardImage();
  }, [selectedRequest]);

  const fetchTradeRequests = async (wallet: string) => {
    const [sent, received] = await Promise.all([
      fetch(`/api/tradeRequest/getSentRequest?wallet=${wallet}`).then((res) =>
        res.json()
      ),
      fetch(`/api/tradeRequest/getReceivedRequest?wallet=${wallet}`).then(
        (res) => res.json()
      ),
    ]);
    setSentRequests(sent);
    setReceivedRequests(received);
  };

  const handleRespondToReceived = async (
    requestId: string,
    action: 'accepted' | 'rejected'
  ) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/tradeRequest/respondToReceivedRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      const text = await res.text(); // use text first
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        result = { message: text }; // fallback in case it's not JSON
      }

      if (res.ok) {
        await fetchTradeRequests(address!);
      } else {
        console.error(
          '❌ Failed response:',
          result.message || result || 'Unknown error'
        );
      }
    } catch (err) {
      console.error('🔥 Exception in handleRespondToReceived:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRespondToSent = async (
    requestId: string,
    action: 'accepted' | 'rejected',
    counterpartyAddress: string,
    selectedTokenId?: number
  ) => {
    setIsProcessing(true);
    try {
      if (!window.ethereum) throw new Error('No crypto wallet found');
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const nftContract = new ethers.Contract(nftAddress, nftAbi, signer);
      const tradeContract = new ethers.Contract(
        tradeContractAddress,
        tradeAbi,
        signer
      );

      if (action === 'accepted') {
        const approveTx = await nftContract.setApprovalForAll(
          tradeContractAddress,
          true
        );
        await approveTx.wait();

        const depositTx = await tradeContract.depositNFT(
          await signer.getAddress(),
          counterpartyAddress,
          selectedTokenId,
          true,
          {
            value: ethers.parseEther('0.0001'),
          }
        );
        await depositTx.wait();
      }

      const res = await fetch('/api/tradeRequest/respondToSentRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        await fetchTradeRequests(userAddress);
      } else {
        console.error(
          'Backend error:',
          result.error || result.message || 'Unknown error'
        );
      }

      if (action === 'accepted') {
        const completeRes = await fetch('/api/tradeRequest/completeTrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: userAddress,
            receiver: counterpartyAddress,
          }),
        });

        const completeResult = await completeRes.json();
        window.alert('Trade completed successfully');
        if (!completeRes.ok) {
          console.error('Complete trade failed:', completeResult.message);
        }
      }

      if (action === 'rejected') {
        const apiRes = await fetch('/api/tradeRequest/cancelTrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: userAddress,
            receiver: counterpartyAddress,
          }),
        });

        const cancelResult = await apiRes.json();
        if (!apiRes.ok) {
          console.error('Trade cancel failed:', cancelResult.error);
        }
      }
    } catch (err) {
      console.error('Error in handleRespondToSent:', err);
      alert('Trade failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-emerald-400';
      case 'rejected':
        return 'text-red-400';
      case 'pending':
        return 'text-amber-400';
      default:
        return 'text-blue-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return '✅';
      case 'rejected':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '🔄';
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      <div className="relative z-10 px-4 py-10 flex flex-col items-center text-white">
        {/* Header Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-2xl animate-fade-in">
            NFT Card Exchange
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Trade your legendary cards with collectors worldwide in a secure,
            decentralized marketplace
          </p>

          {/* Wallet Address Display */}
          {address && (
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-cyan-300 font-semibold">Connected:</span>
              <span className="font-mono text-white text-sm bg-black/20 px-3 py-1 rounded-lg">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {/* Hero Card */}
        <div className="relative mb-12 group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <Image
              src="/tradeCard.svg"
              alt="Trade Card"
              width={280}
              height={280}
              className="mx-auto drop-shadow-2xl rounded-2xl transform group-hover:scale-105 transition-all duration-500"
            />
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleTradeClick}
          className="relative inline-flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-12 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-110 transform group mb-16"
        >
          <span className="text-2xl group-hover:animate-bounce">🚀</span>
          Start Trading Now
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 to-amber-400 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>

        {/* Trading Dashboard */}
        <div className="w-full max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`relative px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'sent'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    📤 Sent Requests
                    {sentRequests.length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {sentRequests.length}
                      </span>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('received')}
                  className={`relative px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'received'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    📥 Received Requests
                    {receivedRequests.length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {receivedRequests.length}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Request Lists */}
          <div className="bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            {activeTab === 'sent' ? (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Your Outgoing Trade Requests
                </h3>
                {sentRequests.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-xl text-slate-400 mb-2">
                      No sent requests yet
                    </p>
                    <p className="text-slate-500">
                      Start your first trade to see requests here
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {sentRequests.map((req: any, index) => (
                      <div
                        key={req.id}
                        className="group bg-gradient-to-r from-slate-700/20 to-slate-600/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02]"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {req.receiver.username[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-lg">
                                To: {req.receiver.username}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-slate-400">
                                  Status:
                                </span>
                                <span
                                  className={`font-semibold flex items-center gap-1 ${getStatusColor(
                                    req.receiverStatus
                                  )}`}
                                >
                                  {getStatusIcon(req.receiverStatus)}{' '}
                                  {req.receiverStatus}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {req.receiverStatus === 'accepted' && (
                              <button
                                onClick={() => {
                                  setSelectedRequest({ ...req, type: 'sent' });
                                  setShowModal(true);
                                }}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300
                                  ${
                                    req.senderStatus === 'accepted' &&
                                    req.receiverStatus === 'accepted'
                                      ? 'bg-green-500 text-white cursor-not-allowed'
                                      : req.senderStatus === 'rejected'
                                      ? 'bg-gray-600/50 text-white cursor-not-allowed'
                                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105'
                                  }`}
                                disabled={
                                  (req.senderStatus === 'accepted' &&
                                    req.receiverStatus === 'accepted') ||
                                  req.senderStatus === 'rejected'
                                }
                              >
                                {req.senderStatus === 'accepted' &&
                                req.receiverStatus === 'accepted'
                                  ? 'Trade Completed'
                                  : req.senderStatus === 'rejected'
                                  ? 'Rejected'
                                  : 'Complete Trade'}
                              </button>
                            )}

                            <div className="text-2xl group-hover:animate-bounce">
                              🎯
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Incoming Trade Requests
                </h3>
                {receivedRequests.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">📬</div>
                    <p className="text-xl text-slate-400 mb-2">
                      No received requests yet
                    </p>
                    <p className="text-slate-500">
                      Traders will contact you soon!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {receivedRequests.map((req: any, index) => (
                      <div
                        key={req.id}
                        className="group bg-gradient-to-r from-slate-700/20 to-slate-600/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/20 transition-all duration-300 hover:scale-[1.02]"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {req.sender.username[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-lg">
                                From: {req.sender.username}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-slate-400">
                                  Status:
                                </span>
                                <span
                                  className={`font-semibold flex items-center gap-1 ${getStatusColor(
                                    req.receiverStatus
                                  )}`}
                                >
                                  {getStatusIcon(req.receiverStatus)}
                                  {req.receiverStatus === 'accepted' &&
                                    req.senderStatus === 'rejected' &&
                                    'Waiting for approval'}
                                  {req.receiverStatus === 'accepted' &&
                                    req.senderStatus === 'accepted' &&
                                    'Trade Complete'}
                                  {req.receiverStatus === 'pending' &&
                                    'Awaiting Response'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => {
                                setSelectedRequest({
                                  ...req,
                                  type: 'received',
                                });
                                setShowModal(true);
                              }}
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
                            >
                              Review Trade
                            </button>
                            <div className="text-2xl group-hover:animate-bounce">
                              💎
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4">
            <div className="relative bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-fade-in">
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200"
              >
                ✕
              </button>

              {/* Modal Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent mb-2">
                  {selectedRequest.type === 'received'
                    ? `🎴 Trade Request from ${selectedRequest.sender.username}`
                    : `🎴 Trade Request to ${selectedRequest.receiver.username}`}
                </h3>
                <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto"></div>
              </div>

              {/* Card Display */}
              <div className="relative mb-6">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20"></div>
                <div className="relative bg-slate-800/50 rounded-2xl p-4">
                  <Image
                    src={selectedRequest.cardImageUrl || '/placeholder.png'}
                    alt="Card"
                    width={240}
                    height={240}
                    className="rounded-xl shadow-2xl mx-auto"
                  />
                </div>
              </div>

              {/* Requested Card */}
              {selectedRequest.type === 'sent' &&
                selectedRequest.receiverStatus === 'accepted' &&
                selectedRequest.requestedCard?.imageUrl && (
                  <div className="mb-6 text-center">
                    <p className="text-lg font-semibold mb-3 text-cyan-300">
                      🎯 Requested Card:
                    </p>
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl blur opacity-20"></div>
                      <div className="relative bg-slate-800/50 rounded-2xl p-4">
                        <Image
                          src={selectedRequest.requestedCard.imageUrl}
                          alt="Requested Card"
                          width={240}
                          height={240}
                          className="rounded-xl shadow-2xl mx-auto"
                        />
                      </div>
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                {selectedRequest.type === 'received' ? (
                  <>
                    <button
                      className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                        selectedRequest.receiverStatus === 'accepted' ||
                        selectedRequest.receiverStatus === 'rejected'
                          ? 'bg-gray-600/50 cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-red-500/30 hover:scale-105'
                      }`}
                      onClick={async () => {
                        if (selectedRequest.receiverStatus !== 'accepted') {
                          await handleRespondToReceived(
                            selectedRequest.id,
                            'rejected'
                          );
                          setShowModal(false);
                        }
                      }}
                      disabled={
                        selectedRequest.receiverStatus === 'accepted' ||
                        isProcessing
                      }
                    >
                      {isProcessing ? 'Processing...' : 'Decline'}
                    </button>
                    <button
                      className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                        selectedRequest.receiverStatus === 'accepted' ||
                        selectedRequest.receiverStatus === 'rejected'
                          ? 'bg-gray-600/50 cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-500/30 hover:scale-105'
                      }`}
                      onClick={async () => {
                        if (selectedRequest.receiverStatus !== 'accepted') {
                          setShowModal(false);
                          router.push(
                            `/user/tradeCards/selectCard/receiver?tradeRequestId=${selectedRequest.id}&friendWallet=${selectedRequest.sender.walletAddress}`
                          );
                        }
                      }}
                      disabled={
                        selectedRequest.receiverStatus === 'accepted' ||
                        isProcessing
                      }
                    >
                      {isProcessing ? 'Processing...' : 'Accept & Choose Card'}
                    </button>
                  </>
                ) : selectedRequest.receiverStatus === 'accepted' ? (
                  <>
                    <button
                      className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                        selectedRequest.senderStatus === 'accepted'
                          ? 'bg-gray-600/50 cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-red-500/30 hover:scale-105'
                      }`}
                      onClick={async () => {
                        if (selectedRequest.senderStatus !== 'accepted') {
                          setIsRejecting(true); // only this button is processing
                          await handleRespondToSent(
                            selectedRequest.id,
                            'rejected',
                            selectedRequest.receiver.walletAddress
                          );
                          setShowModal(false);
                          setIsRejecting(false);
                        }
                      }}
                      disabled={
                        selectedRequest.senderStatus === 'accepted' ||
                        isRejecting
                      }
                    >
                      {isRejecting ? 'Processing...' : 'Reject Trade'}
                    </button>

                    <button
                      className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                        selectedRequest.senderStatus === 'accepted'
                          ? 'bg-gray-600/50 cursor-not-allowed opacity-50'
                          : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-500/30 hover:scale-105'
                      }`}
                      onClick={async () => {
                        if (selectedRequest.senderStatus !== 'accepted') {
                          setIsAccepting(true); // only this button is processing
                          await handleRespondToSent(
                            selectedRequest.id,
                            'accepted',
                            selectedRequest.receiver.walletAddress,
                            selectedRequest.offeredCardId
                          );
                          setShowModal(false);
                          setIsAccepting(false);
                        }
                      }}
                      disabled={
                        selectedRequest.senderStatus === 'accepted' ||
                        isAccepting
                      }
                    >
                      {isAccepting ? 'Processing...' : 'Complete Trade'}
                    </button>
                  </>
                ) : (
                  <button
                    className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-white font-semibold">Loading your trades...</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
