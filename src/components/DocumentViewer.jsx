import { FiFileText, FiDownload, FiExternalLink } from "react-icons/fi";

export default function DocumentViewer({ documents }) {
  const documentTypes = [
    {
      key: "businessLicense",
      label: "İş Lisansı",
      icon: <FiFileText className="text-blue-500" />,
    },
    {
      key: "idDocument",
      label: "Kimlik Belgesi",
      icon: <FiFileText className="text-green-500" />,
    },
    {
      key: "taxCertificate",
      label: "Vergi Levhası",
      icon: <FiFileText className="text-purple-500" />,
    },
    {
      key: "bankLetter",
      label: "Banka Mektubu",
      icon: <FiFileText className="text-yellow-500" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documentTypes.map((doc) => (
          <div
            key={doc.key}
            className="border rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-gray-50 mr-3">{doc.icon}</div>
              <div>
                <h4 className="font-medium">{doc.label}</h4>
                <p className="text-sm text-gray-500">
                  {documents[doc.key] ? "Yüklendi" : "Yüklenmedi"}
                </p>
              </div>
            </div>
            {documents[doc.key] && (
              <a
                href={documents[doc.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 p-2"
                title="Belgeyi Görüntüle"
              >
                <FiExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
