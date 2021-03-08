using System;
using UnityEngine;

namespace DatabaseSync.Components
{
	using Binary;

	/// <summary>
	/// Dialogue Holder
	/// these are the base variables that we need to set
	/// up the dialogue system
	/// </summary>
	public class QuestTable : BaseTable<QuestSO>
	{
		public new static QuestSO ConvertRow(TableRow row, QuestSO scriptableObject = null)
		{
			QuestSO quest = scriptableObject ? scriptableObject : ScriptableObject.CreateInstance<QuestSO>();

			if (row.Fields.Count == 0)
			{
				return quest;
			}

			foreach (var field in row.Fields)
			{
				if (field.Key.Equals("id"))
				{
					quest.ID = uint.Parse(field.Value.Data);
				}

				if (field.Key.Equals("childId"))
				{
					uint data = (uint) field.Value.Data;
					quest.ChildId = data == UInt32.MaxValue - 1 ? UInt32.MaxValue : data;
				}

				if (field.Key.Equals("title"))
				{
					quest.Title = (string) field.Value.Data;
				}

				if (field.Key.Equals("description"))
				{
					quest.Description = (string) field.Value.Data;
				}

				if (field.Key.Equals("typeId"))
				{
					quest.TypeId = (QuestType) field.Value.Data;
				}

				// TODO fetch the task automatically.
			}

			return quest;
		}
	}
}
