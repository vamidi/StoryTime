using UnityEngine;
using System.IO;
using UnityEngine.Networking;

namespace DatabaseSync.Handlers
{
	public class DownloadFileHandler : DownloadHandlerScript
	{
		public ulong ContentLength => _received > _contentLength ? _received : _contentLength;

		private ulong _contentLength;
		private ulong _received;
		private FileStream _stream;

		public DownloadFileHandler(string localFilePath, int bufferSize = 4096,
			FileShare fileShare = FileShare.ReadWrite) : base(new byte[bufferSize])
		{
			string directory = Path.GetDirectoryName(localFilePath);
			if (!Directory.Exists(directory)) Directory.CreateDirectory(directory);

			_contentLength = ulong.MaxValue;
			_received = 0;
			_stream = new FileStream(localFilePath, FileMode.OpenOrCreate, FileAccess.Write, fileShare, bufferSize);
		}

		protected override float GetProgress()
		{
			return ContentLength <= 0 ? 0 : Mathf.Clamp01((float) _received / (float) ContentLength);
		}

		protected override void ReceiveContentLengthHeader (ulong contentLength)
		{
			_contentLength = contentLength;
		}
		 
		protected override bool ReceiveData (byte[] data, int dataLength)
		{
			if(data == null || data.Length == 0) return false;

			_received += (ulong)dataLength;
			_stream.Write(data,0,dataLength);

			return true;
		}

		protected override void CompleteContent ()
		{
			CloseStream();
		}

		public new void Dispose()
		{
			CloseStream();
			base.Dispose();
		}

		private void CloseStream()
		{
			if(_stream!=null)
			{
				_stream.Dispose();
				_stream = null;
			}
		}
	}
}
