using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync
{
	[Serializable]
	public class DialogueNodeData
	{
		public string Guid;
		public string DialogueText;
		public Vector2 Position;

		public override string ToString()
		{
			return $"GUID: {Guid}, text: {DialogueText}, position: {Position}";
		}
	}
}
