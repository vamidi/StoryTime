using System.Linq;
using UnityEngine;

using Newtonsoft.Json.Linq;

namespace DatabaseSync.Components
{
	using Database;
	using Binary;

	// ReSharper disable once InconsistentNaming
	public partial class StorySO
	{
		public class StoryTable : BaseTable<StorySO>
		{
			public new static StorySO ConvertRow(TableRow row, StorySO scriptableObject = null)
			{
				StorySO story = scriptableObject ? scriptableObject : CreateInstance<StorySO>();

				if (row.Fields.Count == 0)
				{
					return story;
				}

				foreach (var field in row.Fields)
				{
					if (field.Key.Equals("id"))
					{
						uint data = (uint) field.Value.Data;
						story.ID = data == uint.MaxValue - 1 ? uint.MaxValue : data;
					}

					// Fetch the first dialogue we should start
					if (field.Key.Equals("childId"))
					{
						// retrieve the necessary items
						uint data = (uint) field.Value.Data;
						story.childId = data == uint.MaxValue - 1 ? uint.MaxValue : data;
					}

					if (field.Key.Equals("parentId"))
					{
						// retrieve the necessary items
						uint data = (uint) field.Value.Data;
						story.parentId = data == uint.MaxValue - 1 ? uint.MaxValue : data;
					}

					if (field.Key.Equals("description"))
					{
						story.description = (string) field.Value.Data;
					}

					if (field.Key.Equals("title"))
					{
						story.title = (string) field.Value.Data;
					}

					// We dont have to parse during editor mode
					// if (field.Key.Equals("data"))
					// {
					// 	Debug.Log("Converting the story data");
					// 	// we are dealing with an json object
					// 	ParseNodeData(story, (JObject) field.Value.Data);
					// }
				}

				return story;
			}

			/// <summary>
			///
			/// </summary>
			public static void ParseNodeData(StorySO story, JObject jObject)
			{
				JObject nodes = jObject["nodes"].ToObject<JObject>();

				// Retrieve the first node. because that is the start node.
				// if not debug show error.
				var nodeToken = nodes.First.Value<JProperty>();

				var node = nodeToken.Value.ToObject<JObject>();
				if (node["name"].ToObject<string>().ToLower() != "start")
				{
					Debug.LogWarning("First Node is not the start node");
					return;
				}

				// start with the start dialogue
				DialogueLine currentDialogue = story.m_StartDialogue;

				// Debug.Log("Current" + currentDialogue);

				ParseNextNodeData(currentDialogue, node, nodes);
			}

			/// <summary>
			/// Grab the next dialogue
			/// nextDialogue = ConvertRow(TableDatabase.Get.GetRow("dialogues", nextDialogueID));
			/// Set the dialogue options associated to the dialogue.
			/// CheckDialogueOptions(nextDialogue);
			/// so input has a connection member that consists of three values
			/// node -> reference to the other node.
			/// output -> reference to the key that consist of the value
			/// so in order to grab the data go to the node
			/// fetch the data
			/// if it is an option take options[$`optionOut-key`] and then the value
			/// if it is a dialogue take data["dialogueId"] -> can be Number.MAX_SAFE_INTEGER
			/// so output has a connection member that consists of three values
			/// node -> reference to the other node.
			/// input -> reference to the key that consist of the value
			/// so in order to grab the data go to the node
			/// fetch the data
			/// if it is an option take options[$`optionOut-key`] and then the value
			/// if it is a dialogue take data["dialogueId"] -> can be Number.MAX_SAFE_INTEGER
			/// </summary>
			/// <param name="currentDialogue"></param>
			/// <param name="node"></param>
			/// <param name="nodes"></param>
			protected static void ParseNextNodeData(IDialogueLine currentDialogue, JObject node, JObject nodes)
			{
				var data = node["data"].ToObject<JObject>();

				// check what is inside the node
				if (data != null && data.ContainsKey("dialogueId"))
				{
					// get the outputs
					var outputs = node["outputs"].ToObject<JObject>();

					// loop through the outputs
					// Outputs can be
					// Dialogue to dialogue
					// option to dialogue
					foreach (var outputToken in outputs)
					{
						var output = outputToken.Value.ToObject<JObject>();
						var connections = output["connections"].ToArray();

						// see if we have a connection
						if (connections.Length == 0)
							continue;

						// See if we are dealing with an option
						bool containsOption = outputToken.Key.Contains("option");

						var connection = connections[0];
						// grab the other node.
						string nodeId = connection["node"].ToObject<int>().ToString();
						JObject otherNode = nodes[nodeId].Value<JObject>();

						var otherData = otherNode["data"].ToObject<JObject>();

						if (currentDialogue != null)
						{
							// if this node does not consist of any choices
							// go this way
							if (!containsOption)
							{
								// Fetch the other dialogueId
								var nextId = otherData["dialogueId"].ToObject<uint>();
								// validate the data
								currentDialogue.NextDialogue = DialogueLine.ConvertRow(TableDatabase.Get.GetRow("dialogues", nextId));

								// Debug.Log(" Next: " + currentDialogue.NextDialogue);

								// now we have the next id check if we have a node that comes after.
								ParseNextNodeData(currentDialogue.NextDialogue, otherNode, nodes);
							}
							else
							{
								// grab the choice id from the current node.
								var optionId = data["options"][outputToken.Key]["value"].ToObject<uint>();

								// Grab the choice
								DialogueChoiceSO choice = DialogueChoiceSO.ConvertRow(TableDatabase.Get.GetRow("dialogueOptions", optionId));

								// Fetch the other dialogueId
								var nextId = otherData["dialogueId"].ToObject<uint>();

								// find the next dialogue of this choice.
								choice.NextDialogue = DialogueLine.ConvertRow(TableDatabase.Get.GetRow("dialogues", nextId));

								// Debug.Log(" Choice: " + choice);

								// add the choices to the currentDialogue
								currentDialogue.Choices.Add(choice);

								// Set the nextDialogue to null because we are dealing with a choice
								currentDialogue.NextDialogue = null;

								// Find the next dialogue for the choice
								ParseNextNodeData(choice.NextDialogue, otherNode, nodes);
							}
						}
					}
				}
			}
		}
	}
}
