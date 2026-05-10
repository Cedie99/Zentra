'use client'

export function SubscribeButton() {
  function handleSubscribe() {
    alert('Pro subscriptions are coming soon!')
  }

  return (
    <button
      onClick={handleSubscribe}
      className="w-full text-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl transition-all duration-200 shadow-md shadow-amber-500/20"
    >
      Subscribe — Coming Soon
    </button>
  )
}
