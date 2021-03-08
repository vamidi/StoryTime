using System;
using UnityEngine;
using UnityEngine.UI;

namespace DatabaseSync.Components
{
	public class Selectable : MonoBehaviour
	{
		public int index = 0;

		public DialogueChoiceSO Option
		{
			set
			{
				_option = value;
				_text.text = value != null ? value.Sentence : "";
			}
			get => _option;
		}

		private DialogueChoiceSO _option;
		private Text _text;

		private void Awake()
		{
			_text = GetComponent<Text>();
		}
	}
}
