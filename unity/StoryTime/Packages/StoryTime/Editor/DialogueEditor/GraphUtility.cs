using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEditor.Experimental.GraphView;
using UnityEngine;
using UnityEngine.UIElements;

namespace DatabaseSync
{
	public class GraphUtility
	{
		private DialogueGraphView _targetGraphView;
		private DialogueContainer _containerCache;
		private List<Edge> Edges => _targetGraphView.edges.ToList();
		private List<DialogueNode> Nodes => _targetGraphView.nodes.ToList().Cast<DialogueNode>().ToList();

		public static GraphUtility Instance(DialogueGraphView targetGraphView)
			=> new GraphUtility {_targetGraphView = targetGraphView};

		public bool SaveGraph(string fileName)
		{
			var dialogueContainer = ScriptableObject.CreateInstance<DialogueContainer>();

			if (!SaveNodes(dialogueContainer))
				return false;

			SaveExposedProperties(dialogueContainer);

			Debug.Log(dialogueContainer);

			// If folder does not exist make one.
			if (!AssetDatabase.IsValidFolder("Assets/Resources"))
				AssetDatabase.CreateFolder("Assets", "Resources");

			Debug.Log(dialogueContainer);

			AssetDatabase.CreateAsset(dialogueContainer, $"Assets/Resources/{fileName}.asset");
			AssetDatabase.SaveAssets();

			return true;
		}

		public void LoadGraph(string fileName)
		{
			_containerCache = Resources.Load<DialogueContainer>(fileName);
			if (!_containerCache)
			{
				EditorUtility.DisplayDialog("File not Found", "Target dialogue graph file does not exists!", "OK");
				return;
			}

			ClearGraph();
			CreateNodes();
			ConnectNodes();
			CreateExposedProperties();
		}

		private void CreateExposedProperties()
		{
			_targetGraphView.ClearBlackBoardAndExposedProperties();
			foreach (var exposedProperty in _containerCache.ExposedProperties)
			{
				_targetGraphView.AddPropertyToBlackBoard(exposedProperty);
			}
		}

		private void SaveExposedProperties(DialogueContainer dialogueContainer)
		{
			dialogueContainer.ExposedProperties.AddRange(_targetGraphView.ExposedProperties);
		}

		private void ClearGraph()
		{
			// set entry point discard existing guid
			Nodes.Find(x => x.EntryPoint).GUID = _containerCache.NodeLinks[0].BaseNodeGuid;

			foreach (var perNode in Nodes)
			{
				if (perNode.EntryPoint) continue;
				Edges.Where(x => x.input.node == perNode).ToList()
					.ForEach(edge => _targetGraphView.RemoveElement(edge));
				_targetGraphView.RemoveElement(perNode);
			}
		}

		private void CreateNodes()
		{
			foreach (var nodeData in _containerCache.DialogueNodeData)
			{
				var tempNode = _targetGraphView.CreateDialogueNode(nodeData.DialogueText, nodeData.Position);
				tempNode.GUID = nodeData.Guid;
				_targetGraphView.AddElement(tempNode);
				var nodePorts = _containerCache.NodeLinks.Where(x => x.BaseNodeGuid == nodeData.Guid).ToList();
				nodePorts.ForEach(x => _targetGraphView.AddChoicePort(tempNode, x.PortName));
			}
		}

		private bool SaveNodes(DialogueContainer dialogueContainer)
		{
			if (!Edges.Any()) return false; // if there are no edges

			var connectedSockets = Edges.Where(x => x.input.node != null).ToArray();
			for (var i = 0; i < connectedSockets.Count(); i++)
			{
				var outputNode = connectedSockets[i].output.node as DialogueNode;
				var inputNode = connectedSockets[i].input.node as DialogueNode;

				dialogueContainer.NodeLinks.Add(new NodeLinkData
				{
					BaseNodeGuid = outputNode.GUID,
					PortName = connectedSockets[i].output.portName,
					TargetNodeGuid = inputNode.GUID
				});
			}

			foreach (var dialogueNode in Nodes.Where(node => !node.EntryPoint))
			{
				dialogueContainer.DialogueNodeData.Add(new DialogueNodeData
				{
					Guid = dialogueNode.GUID,
					DialogueText = dialogueNode.DialogueText,
					Position = dialogueNode.GetPosition().position
				});
			}

			return true;
		}

		private void ConnectNodes()
		{
			for (var i = 0; i < Nodes.Count; i++)
			{
				var k = i; //Prevent access to modified closure
				var connections = _containerCache.NodeLinks.Where(x => x.BaseNodeGuid == Nodes[k].GUID).ToList();
				for (var j = 0; j < connections.Count; j++)
				{
					var targetNodeGUID = connections[j].TargetNodeGuid;
					var targetNode = Nodes.First(x => x.GUID == targetNodeGUID);
					LinkNodes(Nodes[i].outputContainer[j].Q<Port>(), (Port) targetNode.inputContainer[0]);
					targetNode.SetPosition(new Rect(
						_containerCache.DialogueNodeData.First(x => x.Guid == targetNodeGUID).Position,
						_targetGraphView.DefaultNodeSize));
				}
			}
		}

		private void LinkNodes(Port output, Port input)
		{
			var tempEdge = new Edge
			{
				output = output,
				input = input
			};

			tempEdge?.input.Connect(tempEdge);
			tempEdge?.output.Connect(tempEdge);
			_targetGraphView.Add(tempEdge);
		}
	}
}
