using UnityEditor.Experimental.GraphView;

namespace DatabaseSync
{
	public class DialogueNode : Node
	{
		/// <summary>
		/// Unique
		/// </summary>
		public string GUID = "";

		public string DialogueText = "";

		public bool EntryPoint = false;
	}
}
