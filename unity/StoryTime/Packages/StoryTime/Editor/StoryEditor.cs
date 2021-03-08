using System;
using System.Linq;
using System.Collections.Generic;

using UnityEditor;
using UnityEngine;

namespace DatabaseSync.Components
{
	using Database;

	public class BaseTableEditor<T> : Editor where T : TableBehaviour
	{
		protected int Choice
		{
			set => _choiceIndex = value;
		}

		private int _choiceIndex = Int32.MaxValue;

		protected Dictionary<uint, string> PopulatedList = new Dictionary<uint, string>();

		public virtual void OnEnable()
		{
			DatabaseSyncModule.FetchCompleted += (o, args) =>
			{
				TableDatabase.Get.Refresh();
				GenerateList();
			};
			GenerateList();

			// set the id right
			var t = target as TableBehaviour;
			if (t) _choiceIndex = (int) t.ID;
		}

		protected virtual string GetGameObjectName() => typeof(T).Name;

		protected T GetObject()
		{
			if (target is T) {
				return (T)target;
			}
			try {
				return (T)Convert.ChangeType(target, typeof(T));
			}
			catch (InvalidCastException) {
				return default;
			}
		}

		protected void RenameAsset(UnityEngine.Object t, string fileName)
		{
			string assetPath = AssetDatabase.GetAssetPath(t.GetInstanceID());
			AssetDatabase.RenameAsset(assetPath, fileName);
			AssetDatabase.SaveAssets();
		}

		protected virtual void OnChanged() { }

		public override void OnInspectorGUI()
		{
			// Draw the default inspector
			DrawDefaultInspector();
			GUIContent arrayLabel = new GUIContent("ID");
			_choiceIndex = EditorGUILayout.Popup(arrayLabel, _choiceIndex, PopulatedList.Values.ToArray());
			var t = target as TableBehaviour;
			if (t && t.ID != _choiceIndex)
			{
				// Update the selected choice in the underlying object
				t.ID = (uint) _choiceIndex;
				OnChanged();

				// Save the changes back to the object
				EditorUtility.SetDirty(target);
			}
		}

		protected virtual void GenerateList()
		{
			var tableComponent = target as TableBehaviour;
			if (tableComponent != null)
			{
				_choiceIndex = (int) tableComponent.ID;

				var binary = TableDatabase.Get.GetBinary(tableComponent.Name);
				string linkColumn = tableComponent.LinkedColumn;
				uint linkId = tableComponent.LinkedID;
				PopulatedList = linkColumn != "" && linkId != UInt32.MaxValue ? binary.PopulateWithLink(
					tableComponent.DropdownColumn,
					linkColumn,
					linkId
				) : binary.Populate(tableComponent.DropdownColumn);
			}
		}
	}

	[CustomEditor(typeof(TableBehaviour), true)]
	public class TableEditor : BaseTableEditor<TableBehaviour>
	{
		public override void OnEnable()
		{
			base.OnEnable();
			GenerateList();
		}
	}

	/// <summary>
	/// ActorSO editor settings
	/// </summary>
	[CustomEditor(typeof(ActorSO))]
	public class ActorEditor : BaseTableEditor<ActorSO>
	{
		public override void OnEnable()
		{
			base.OnEnable();
			GenerateList();
		}

		protected override void OnChanged()
		{
			var t = target as ActorSO;
			if (t && t.ID != UInt32.MaxValue)
			{
				var row = TableDatabase.Get.GetRow(t.Name, t.ID);
				if (row != null)
				{
					// set all the values from the selected row
					// t = CharacterTable.ConvertRow(row);
					RenameAsset(target, t.ActorName);
				}
			}
		}
	}

	[CustomEditor(typeof(StorySO))]
	public class StoryEditor : BaseTableEditor<StorySO>
	{
		protected override void OnChanged()
		{
			var t = target as StorySO;
			if (t != null && t.ID != UInt32.MaxValue)
			{
				var row = TableDatabase.Get.GetRow(t.Name, t.ID);

				// set all the values from the selected row
				if (row != null)
					StorySO.StoryTable.ConvertRow(row, t);
			}
		}

		/*
		public override void OnInspectorGUI()
		{
			base.OnInspectorGUI();
			///
			/// Automate the way we create stories
			///
			if(GUILayout.Button("Save and generate"))
			{
				var tableComponent = target as StorySO;
				// if we have not target or no actor or no story selected don't continue.
				if (!tableComponent || tableComponent.ID == UInt32.MaxValue)
				{
					Debug.LogError("We are missing a target or ID");
					return;
				}

				// create all the dialogue lines
				// get the first field
				TableRow row = TableDatabase.Get.GetRow("stories", tableComponent.ID);

				StorySO.StoryTable.ConvertRow(row, tableComponent);
				if (tableComponent && row != null)
				{
					// convert row data
					RenameAsset(target, tableComponent.Title);
				}
			}
		}

		/// <summary>
		///
		/// </summary>
		/// <param name="directory"></param>
		/// <param name="nextDialogueID"></param>
		/// <returns></returns>
		private DialogueLineSO GetNextDialogue(string directory, UInt32 nextDialogueID)
		{
			DialogueLineSO dialogue = null;
			// See if we have other dialogue after this one
			if (nextDialogueID != UInt32.MaxValue)
			{
				dialogue = DialogueTable.ConvertRow(TableDatabase.Get.GetRow("dialogues", nextDialogueID));
				dialogue.ID = m_NextID;

				// Set the dialogue options associated to the dialogue.
				var optionsAssociated = CheckDialogueOptions(directory, dialogue);
				if (optionsAssociated.Count > 0) dialogue.Choices = optionsAssociated;
			}

			return dialogue;
		}

		private string RelativePath(string directory)
		{
			var relativePath = HelperClass.MakePathRelative(directory);
			Directory.CreateDirectory(relativePath);

			return relativePath;
		}

		private void SaveDialogueAsset(string directory, DialogueLine dialogueLineSo)
		{
			var relativePath = RelativePath(directory);
			var sharedDataPath = Path.Combine(relativePath, $"{dialogueLineSo.Actor.ActorName}_line_{dialogueLineSo.ID}.asset");
			sharedDataPath = AssetDatabase.GenerateUniqueAssetPath(sharedDataPath);
			SaveAsset(dialogueLineSo, sharedDataPath);
		}

		private void SaveDialogueOptionAsset(string directory, ActorSO actorSo, DialogueChoiceSO dialogueChoiceSo)
		{
			var relativePath = RelativePath(directory);

			var sharedDataPath = Path.Combine(relativePath, $"{actorSo.ActorName}_option_{dialogueChoiceSo.ID}.asset");
			sharedDataPath = AssetDatabase.GenerateUniqueAssetPath(sharedDataPath);
			SaveAsset(dialogueChoiceSo, sharedDataPath);
		}

		private void SaveAsset(UnityEngine.Object asset, string path)
		{
			AssetDatabase.CreateAsset(asset, path);
			AssetDatabase.Refresh();
		}
		*/
	}

	[CustomEditor(typeof(DialogueLineSO))]
	public class DialogueEditor : BaseTableEditor<DialogueLineSO>
	{
		protected override void OnChanged()
		{
			var t = target as DialogueLineSO;
			if (t != null && t.ID != UInt32.MaxValue)
			{
				var row = TableDatabase.Get.GetRow(t.Name, t.ID);

				// set all the values from the selected row
				if (row != null) DialogueLineSO.ConvertRow(row, t);
			}
		}
	}

	[CustomEditor(typeof(QuestSO))]
	public class QuestEditor : BaseTableEditor<QuestSO>
	{
		protected override void OnChanged()
		{
			var t = target as QuestSO;
			if (t != null && t.ID != UInt32.MaxValue)
			{
				var row = TableDatabase.Get.GetRow(t.Name, t.ID);

				// set all the values from the selected row
				if (row != null)
					QuestTable.ConvertRow(row, t);
			}
		}
	}

	[CustomEditor(typeof(TaskSO))]
	public class TaskEditor : BaseTableEditor<TaskSO>
	{
		protected override void OnChanged()
		{
			var t = target as TaskSO;
			if (t != null && t.ID != UInt32.MaxValue)
			{
				var row = TableDatabase.Get.GetRow(t.Name, t.ID);

				// set all the values from the selected row
				if (row != null)
					TaskTable.ConvertRow(row, t);
			}
		}
	}

	[CustomEditor(typeof(ItemSO))]
	public class ItemEditor : BaseTableEditor<ItemSO>
	{
		protected override void OnChanged()
		{
			var t = target as ItemSO;
			if (t != null && t.ID != UInt32.MaxValue)
			{
				var row = TableDatabase.Get.GetRow(t.Name, t.ID);

				// set all the values from the selected row
				if (row != null)
					ItemTable.ConvertRow(row, t);
			}
		}
	}

	[CustomEditor(typeof(EnemySO))]
	public class EnemyEditor : BaseTableEditor<EnemySO>
	{
		protected override void OnChanged()
		{
			var t = target as EnemySO;
			if (t != null && t.ID != UInt32.MaxValue)
			{
				var row = TableDatabase.Get.GetRow(t.Name, t.ID);

				// set all the values from the selected row
				if (row != null)
					EnemyTable.ConvertRow(row, t);
			}
		}
	}
}
