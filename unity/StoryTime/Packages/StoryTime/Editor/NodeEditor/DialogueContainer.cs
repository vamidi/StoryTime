using System.Collections.Generic;
using UnityEngine;

namespace DatabaseSync
{
	public class DialogueContainer : ScriptableObject
	{
		public List<NodeLinkData> NodeLinks = new List<NodeLinkData>();
		public List<DialogueNodeData> DialogueNodeData = new List<DialogueNodeData>();
		public List<ExposedProperty> ExposedProperties = new List<ExposedProperty>();
	}
}
