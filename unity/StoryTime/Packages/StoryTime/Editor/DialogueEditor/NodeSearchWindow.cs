using System.Collections.Generic;
using UnityEditor;
using UnityEditor.Experimental.GraphView;
using UnityEngine;
using UnityEngine.UIElements;

namespace DatabaseSync
{
	public class NodeSearchWindow : ScriptableObject, ISearchWindowProvider
	{
		private DialogueGraphView _graphView;
		private EditorWindow _window;

		public void Init(DialogueGraphView graphView, EditorWindow window)
		{
			_graphView = graphView;
			_window = window;
		}

		public List<SearchTreeEntry> CreateSearchTree(SearchWindowContext context)
		{
			var tree = new List<SearchTreeEntry>
			{
				new SearchTreeGroupEntry(new GUIContent("Create Elements:")),
				new SearchTreeGroupEntry(new GUIContent("Nodes"), 1),
				new SearchTreeEntry(new GUIContent("Dialogue Node"))
				{
					userData = new DialogueNode(), level = 2,
				},
			};

			return tree;
		}

		public bool OnSelectEntry(SearchTreeEntry searchTreeEntry, SearchWindowContext context)
		{
			var worldMousePosition = _window.rootVisualElement.ChangeCoordinatesTo(_window.rootVisualElement.parent,
				context.screenMousePosition - _window.position.position);

			var localMousePosition = _graphView.contentViewContainer.WorldToLocal(worldMousePosition);

			switch (searchTreeEntry.userData)
			{
				case DialogueNode _:
					_graphView.CreateNode("Dialogue Node", localMousePosition);
					return true;
				default: return false;
			}
		}
	}
}

