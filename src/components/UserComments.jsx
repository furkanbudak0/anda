export default function UserComments() {
  return (
    <section className="bg-white rounded-xl shadow p-4">
      <h3 className="text-md font-semibold mb-2 text-orange-500">Yorumlarım</h3>
      <div className="space-y-3">
        <div>
          <p className="text-gray-800 font-medium">iPhone 14 Pro Max</p>
          <p className="text-sm text-gray-600">
            Harika kamera performansı, şiddetle tavsiye ederim!
          </p>
        </div>
        <div>
          <p className="text-gray-800 font-medium">Logitech MX Master</p>
          <p className="text-sm text-gray-600">
            Çok ergonomik ve hassas bir mouse.
          </p>
        </div>
      </div>
    </section>
  );
}
