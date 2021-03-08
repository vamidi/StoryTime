using System;
using System.Linq;
using UnityEditor;
using UnityEditor.Experimental.GraphView;
using UnityEditor.Rendering;
using UnityEditor.UIElements;
using UnityEngine;
using UnityEngine.UIElements;

namespace DatabaseSync
{
	public class DialogueGraph : EditorWindow
	{
		private DialogueGraphView _graphView;
		private string _fileName = "New Narrative";

		[MenuItem("Graph/Dialogue Graph")]
		public static void OpenDialogueGraphWindow()
		{
			var window = GetWindow<DialogueGraph>();
			window.titleContent = new GUIContent("Dialogue Graph");
		}

		public void OnEnable()
		{
			ConstructGraphView();
			GenerateToolbar();
			GenerateMiniMap();
			GenerateBlackBoard();
		}

		private void GenerateToolbar()
		{
			var toolbar = new Toolbar();

			var fileNameTextField = new TextField("File Name");
			fileNameTextField.SetValueWithoutNotify(_fileName);
			fileNameTextField.MarkDirtyRepaint();
			fileNameTextField.RegisterValueChangedCallback(evt => _fileName = evt.newValue);
			toolbar.Add(fileNameTextField);

			toolbar.Add(new Button(() => RequestDataOperation(true)){ text = "Save Data"});
			toolbar.Add(new Button(() => RequestDataOperation(false)){ text = "Load Data"});

			rootVisualElement.Add(toolbar);
		}

		private void GenerateMiniMap()
		{
			var miniMap = new MiniMap{ anchored = true };
			var coords = _graphView.contentViewContainer.WorldToLocal(new Vector2(maxSize.x - 10, 30));
			miniMap.SetPosition(new Rect(coords.x, coords.y, 200, 140));
			_graphView.Add(miniMap);
		}

		private void GenerateBlackBoard()
		{
			var blackboard = new Blackboard(_graphView);
			blackboard.Add(new BlackboardSection{ title = "Exposed Properties" });
			blackboard.addItemRequested = blackBoard => _graphView.AddPropertyToBlackBoard(new ExposedProperty());
			blackboard.editTextRequested = (blackBoard, element, newValue) =>
			{
				var oldPropertyName = ((BlackboardField) element).text;
				if(_graphView.ExposedProperties.Any(x => x.PropertyName == newValue))
				{
					EditorUtility.DisplayDialog("Error",
						"This proeperty name already exists, please choose another one!", "OK");
					return;
				}

				var propertyIndex = _graphView.ExposedProperties.FindIndex(x => x.PropertyName == oldPropertyName);
				_graphView.ExposedProperties[propertyIndex].PropertyName = newValue;
				((BlackboardField) element).text = newValue;
			};
			blackboard.SetPosition(new Rect(10, 30, 200, 300));
			_graphView.Add(blackboard);
			_graphView.BlackBoard = blackboard;
		}

		private void RequestDataOperation(bool bSave)
		{
			if (string.IsNullOrEmpty(_fileName))
			{
				EditorUtility.DisplayDialog("Invalid file name!", "Please enter a valid filename.", "OK");
				return;
			}

			var saveUtility = GraphUtility.Instance(_graphView);
			if (bSave)
				saveUtility.SaveGraph(_fileName);
			else
				saveUtility.LoadGraph(_fileName);
		}

		private void ConstructGraphView()
		{
			_graphView = new DialogueGraphView(this)
			{
				name = "Dialogue Graph",
			};

			_graphView.StretchToParentSize();
			rootVisualElement.Add(_graphView);
		}

		private void OnDisable()
		{
			rootVisualElement.Remove(_graphView);
		}
	}
}
