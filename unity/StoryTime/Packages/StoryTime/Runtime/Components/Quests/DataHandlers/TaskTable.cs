using System;
using UnityEngine;

namespace DatabaseSync.Components
{
	using Binary;

	public class TaskTable : BaseTable<TaskSO>
	{
		public new static TaskSO ConvertRow(TableRow row, TaskSO scriptableObject = null)
		{
			TaskSO task = scriptableObject ? scriptableObject : ScriptableObject.CreateInstance<TaskSO>();

			if (row.Fields.Count == 0)
			{
				return task;
			}

			foreach (var field in row.Fields)
			{
				if (field.Key.Equals("id"))
				{
					task.ID = uint.Parse(field.Value.Data);
				}

				if (field.Key.Equals("nextId"))
				{
					uint data = (uint) field.Value.Data;
					task.NextId = data == UInt32.MaxValue - 1 ? UInt32.MaxValue : data;
				}

				if (field.Key.Equals("description"))
				{
					task.Description = (string) field.Value.Data;
				}

				if (field.Key.Equals("hidden"))
				{
					task.Hidden = (bool) field.Value.Data;
				}

				if (field.Key.Equals("npc"))
				{
					uint data = (uint) field.Value.Data;
					task.Npc = data == UInt32.MaxValue - 1 ? UInt32.MaxValue : data;
				}

				if (field.Key.Equals("parentId"))
				{
					uint data = (uint) field.Value.Data;
					task.ParentId = data == UInt32.MaxValue - 1 ? UInt32.MaxValue : data;
				}

				if (field.Key.Equals("requiredCount"))
				{
					task.RequiredCount = (uint) field.Value.Data;
				}

				if (field.Key.Equals("typeId"))
				{
					task.Type = (TaskCompletionType) field.Value.Data;
				}

			}

			return task;
		}
	}
}
