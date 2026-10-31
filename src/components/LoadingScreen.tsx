export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div
        role="status"
        aria-label="読み込み中"
        className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-500 animate-spin"
      />
    </div>
  )
}
