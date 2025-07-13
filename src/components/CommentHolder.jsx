export default function CommentHolder({ comment, avgRating }) {
  return (
    <div className="bg-white shadow-lg rounded-xl p-5 mb-4 border border-gray-200">
      {/* Kullanıcı Adı ve Puan */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800">
          {comment.username}
        </h3>
        <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">
          {avgRating} ★
        </span>
      </div>

      {/* Yorum Metni */}
      <p className="text-gray-700 text-lg leading-relaxed">{comment.text}</p>

      {/* Tarih */}
      <div className="text-right text-sm text-gray-500 mt-3">
        {new Date(comment.date).toLocaleDateString()}
      </div>
    </div>
  );
}
