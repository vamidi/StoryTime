using System;
using System.Collections.Generic;
using System.Linq;
using UnityEditor;
using UnityEditor.Experimental.GraphView;
using UnityEngine;
using UnityEngine.UIElements;

namespace DatabaseSync
{
	public class DialogueGraphView : GraphView
	{
		public readonly Vector2 DefaultNodeSize = new Vector2(150, 200);
		public Blackboard BlackBoard;
		public List<ExposedProperty> ExposedProperties = new List<ExposedProperty>();

		private NodeSearchWindow _searchWindow;

		public DialogueGraphView(EditorWindow editorWindow)
		{
			styleSheets.Add(Resources.Load<StyleSheet>("DialogueGraph"));
			SetupZoom(ContentZoomer.DefaultMinScale, ContentZoomer.DefaultMaxScale);

			this.AddManipulator(new ContentDragger());
			this.AddManipulator(new SelectionDragger());
			this.AddManipulator(new RectangleSelector());

			var grid = new GridBackground();
			Insert(0, grid);
			grid.StretchToParentSize();

			AddElement(GenerateEntryPointNode());
			AddSearchWindow(editorWindow);
		}

		public override List<Port> GetCompatiblePorts(Port startPort, NodeAdapter nodeAdapter)
		{
			var compatiblePorts = new List<Port>();
			ports.ForEach((port) =>
			{
				if (startPort != port && startPort.node != port.node)
					compatiblePorts.Add(port);
			});

			return compatiblePorts;
		}

		public void ClearBlackBoardAndExposedProperties()
		{
			ExposedProperties.Clear();
			BlackBoard.Clear();
		}

		public void AddPropertyToBlackBoard(ExposedProperty exposedProperty)
		{
			var localPropertyName = exposedProperty.PropertyName;
			var localPropertyValue = exposedProperty.PropertValue;

			while (ExposedProperties.Any(x => x.PropertyName == localPropertyName))
				localPropertyName = $"{localPropertyName}(1)";

			var property = new ExposedProperty
			{
				PropertyName = localPropertyName, PropertValue = localPropertyValue
			};
			ExposedProperties.Add(property);

			var container = new VisualElement();
			var blackboardField = new BlackboardField{ text = property.PropertyName, typeText = "string"};
			container.Add(blackboardField);

			var propertyValueTextField = new TextField("Value:")
			{
				value = localPropertyName,
			};
			propertyValueTextField.RegisterValueChangedCallback(evt =>
			{
				var changingPropertyIndex = ExposedProperties.FindIndex(x => x.PropertyName == property.PropertyName);
				ExposedProperties[changingPropertyIndex].PropertValue = evt.newValue;
			});

			var blackBoardValueRow = new BlackboardRow(blackboardField, propertyValueTextField);
			container.Add(blackBoardValueRow);

			BlackBoard.Add(container);
		}

		public DialogueNode CreateDialogueNode(string nodeName, Vector2 position)
		{
			var dialogueNode = new DialogueNode
			{
				title = nodeName,
				DialogueText = nodeName,
				GUID = Guid.NewGuid().ToString()
			};

			var inputPort = GeneratePort(dialogueNode, Direction.Input, Port.Capacity.Multi);
			inputPort.portName = "Input";
			dialogueNode.inputContainer.Add(inputPort);

			dialogueNode.styleSheets.Add(Resources.Load<StyleSheet>("Node"));

			var button = new Button(() => AddChoicePort(dialogueNode)) {text = "New Choice"};
			dialogueNode.titleContainer.Add(button);

			var textField = new TextField(string.Empty);
			textField.RegisterValueChangedCallback(evt =>
			{
				dialogueNode.DialogueText = dialogueNode.title = evt.newValue;
			});
			textField.SetValueWithoutNotify(dialogueNode.title);
			dialogueNode.mainContainer.Add(textField);

			dialogueNode.RefreshExpandedState();
			dialogueNode.RefreshPorts();
			dialogueNode.SetPosition(new Rect(position, DefaultNodeSize));

			return dialogueNode;
		}

		public void AddChoicePort(DialogueNode dialogueNode, string overridenPortName = "")
		{
			var generatePort = GeneratePort(dialogueNode, Direction.Output);
			var oldLabel = generatePort.contentContainer.Q<Label>("type");
			generatePort.contentContainer.Remove(oldLabel);

			var outputPortCount = dialogueNode.outputContainer.Query("connector").ToList().Count;

			var choicePortName = string.IsNullOrEmpty(overridenPortName)
				? $"Choice {outputPortCount + 1}"
				: overridenPortName;
			var textField = new TextField
			{
				name = string.Empty,
				value = choicePortName
			};
			textField.RegisterValueChangedCallback(evt => generatePort.portName = evt.newValue);
			generatePort.contentContainer.Add(new Label(" "));
			generatePort.contentContainer.Add(textField);
			var deleteButton = new Button(() => RemovePort(dialogueNode, generatePort))
			{
				text = "X"
			};
			generatePort.contentContainer.Add(deleteButton);

			generatePort.portName = choicePortName;
			dialogueNode.outputContainer.Add(generatePort);
			dialogueNode.RefreshExpandedState();
			dialogueNode.RefreshPorts();
		}

		public void CreateNode(string nodeName, Vector2 position)
		{
			AddElement(CreateDialogueNode(nodeName, position));
		}

		private void AddSearchWindow(EditorWindow editorWindow)
		{
			_searchWindow = ScriptableObject.CreateInstance<NodeSearchWindow>();
			_searchWindow.Init(this, editorWindow);
			nodeCreationRequest = ctx =>
				SearchWindow.Open(new SearchWindowContext(ctx.screenMousePosition), _searchWindow);
		}

		private void RemovePort(DialogueNode dialogueNode, Port generatePort)
		{
			var targetEdge = edges.ToList().Where(x =>
				x.output.portName == generatePort.portName && x.output.node == generatePort.node);

			if (!targetEdge.Any())
			{
				var edge = targetEdge.First();

				edge.input.Disconnect(edge);
				RemoveElement(targetEdge.First());
			}

			dialogueNode.outputContainer.Remove(generatePort);
			dialogueNode.RefreshPorts();
			dialogueNode.RefreshExpandedState();
		}

		private Port GeneratePort(DialogueNode node, Direction portDirection,
			Port.Capacity capacity = Port.Capacity.Single)
		{
			return node.InstantiatePort(Orientation.Horizontal, portDirection, capacity, typeof(float));
		}

		private DialogueNode GenerateEntryPointNode()
		{
			var node = new DialogueNode
			{
				title = "START",
				GUID = Guid.NewGuid().ToString(),
				DialogueText = "ENTRYPOINT",
				EntryPoint = true
			};

			var generatePort = GeneratePort(node, Direction.Output);
			generatePort.portName = "Next";
			node.outputContainer.Add(generatePort);

			node.capabilities &= ~Capabilities.Movable;
			node.capabilities &= ~Capabilities.Deletable;

			node.AddToClassList("StartNode");
			node.styleSheets.Add(Resources.Load<StyleSheet>("Node"));

			node.RefreshExpandedState();
			node.RefreshPorts();

			node.SetPosition(new Rect(100, 200, 100, 150));

			return node;
		}
	}
}
