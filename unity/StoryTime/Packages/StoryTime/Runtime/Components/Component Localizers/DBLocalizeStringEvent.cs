using System;
using System.Collections.Generic;

using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Components
{

	/// <summary>
	/// Component that can be used to Localize a string.
	/// Allows for configuring optional string arguments and provides an update event that can be used to update the string.
	/// </summary>
	[AddComponentMenu("DatabaseSync/Localization/Localize String Event")]
	public class DBLocalizeStringEvent : MonoBehaviour
	{
		/// <summary>
		/// UnityEvent which can pass a string as an argument.
		/// </summary>
		[Serializable]
		public class StringUnityEvent : UnityEvent<string>
		{
		}

		[SerializeField]
		/* LocalizedString */ string stringReference = String.Empty;

		[SerializeField] List<UnityEngine.Object> formatArguments = new List<UnityEngine.Object>();

		[SerializeField] StringUnityEvent updateString = new StringUnityEvent();

		/// <summary>
		/// References the <see cref="StringTable"/> and <see cref="StringTableEntry"/> of the localized string.
		/// </summary>
		public string /* LocalizedString */ StringReference
		{
			get => stringReference;
			set
			{
				// Unsubscribe from the old string reference.
				ClearChangeHandler();

				stringReference = value;

				if (enabled)
					UpdateString(stringReference);
				// RegisterChangeHandler();
			}
		}

		/// <summary>
		/// Event that will be sent when the localized string is ready.
		/// </summary>
		public StringUnityEvent OnUpdateString
		{
			get => updateString;
			set => updateString = value;
		}

		/// <summary>
		/// Starts listening for changes to <see cref="StringReference"/>.
		/// </summary>
		protected virtual void OnEnable() => RegisterChangeHandler();

		/// <summary>
		/// Stops listening for changes to <see cref="StringReference"/>.
		/// </summary>
		protected virtual void OnDisable() => ClearChangeHandler();

		/// <summary>
		/// Invokes the <see cref="OnUpdateString"/> event.
		/// </summary>
		/// <param name="value"></param>
		protected virtual void UpdateString(string value) => OnUpdateString.Invoke(value);

		void RegisterChangeHandler()
		{
			if (formatArguments.Count > 0)
			{
				// StringReference.Arguments = formatArguments.ToArray();
			}

			// StringReference.StringChanged += UpdateString;
		}

		void ClearChangeHandler()
		{
			// StringReference.StringChanged -= UpdateString;
		}
	}
}
