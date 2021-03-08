using System;
using System.Collections.ObjectModel;
using UnityEditor;
using UnityEngine;

namespace DatabaseSync.UI
{
    [CustomPropertyDrawer(typeof(LocalizedTable), true)]
    class TablePropertyDrawer<TCollection>: PropertyDrawerExtended<TablePropertyDrawer<TCollection>.Data> where TCollection : LocalizedTable
    {
	    protected static class Styles
	    {
		    public static readonly GUIContent AddLocale = new GUIContent("Add Locale", "Add a new Locale.");
		    // public static readonly GUIContent addTable = new GUIContent("Create Table", "Create a new table for the selected locale.");
		    public static readonly GUIContent AddTableCollection = new GUIContent("Create Table Collection", "Create a new table collection for every Locale in the project");
		    public static readonly GUIContent AddTableEntry = new GUIContent("Add Table Entry", "Create a new table entry in the selected table collection.");
		    public static readonly GUIContent EntryName = new GUIContent("Entry Name", "The name or key of the selected table entry");
		    public static readonly GUIContent NoTableSelected = new GUIContent($"None({typeof(TCollection).Name})");
		    // public static readonly GUIContent previewArguments = new GUIContent("Preview Arguments", "Arguments to pass to the string formatter. These are for preview purposes only and are not stored.");
		    public static readonly GUIContent SelectedTable = new GUIContent("Table Collection");
	    }

	    public class Data
        {
            public SerializedObject serializedObject;
            // public SerializedTableReference tableReference;
            // public SerializedTableEntryReference tableEntryReference;
            public Type assetType;
            public GUIContent entryNameLabel;

            GUIContent m_FieldLabel;

            // SharedTableData.SharedTableEntry m_SelectedEntry;
            TCollection m_SelectedTableCollection;
            int m_SelectedTableIdx = -1;

            public bool NeedsInitializing { get; protected set; } = true;

            public int SelectedTableIndex
            {
                get
                {
                    if (m_SelectedTableIdx < 0)
                    {
                        if (SelectedTableCollection == null)
                        {
                            m_SelectedTableIdx = 0;
                        }
                        else
                        {
                            for (int i = 1; i < ProjectTableLabels.Length; ++i)
                            {
                                // if (SelectedTableCollection.TableCollectionName == ProjectTableLabels[i].text)
                                // {
                                    // m_SelectedTableIdx = i;
                                    // break;
                                // }
                            }
                        }
                    }
                    return m_SelectedTableIdx;
                }
                set
                {
                    m_SelectedTableIdx = value;
                    SelectedTableCollection = s_TableChoices[m_SelectedTableIdx];
                    m_FieldLabel = null;
                }
            }

            public TCollection SelectedTableCollection
            {
                get
                {
                    if (m_SelectedTableCollection == null)
                    {
                        var tableCollections = GetProjectTableCollections();
                        // if (tableReference.Reference.ReferenceType == TableReference.Type.Name)
                        // {
                            // m_SelectedTableCollection = tableCollections.FirstOrDefault(t => t.TableCollectionName == tableReference.Reference);
                        // }
                        // else if (tableReference.Reference.ReferenceType == TableReference.Type.Guid)
                        // {
                            // m_SelectedTableCollection = tableCollections.FirstOrDefault(t => t.SharedData.TableCollectionNameGuid == tableReference.Reference);
                        // }
                    }
                    return m_SelectedTableCollection;
                }
                set
                {
                    m_SelectedTableCollection = value;
                    m_SelectedTableIdx = -1;
                    // SelectedTableEntry = null;
                    // if (value != null)
                        // tableReference.Reference = value.SharedData.TableCollectionNameGuid;
                    // else
                        // tableReference.Reference = string.Empty;
                }
            }

            // public virtual SharedTableData.SharedTableEntry SelectedTableEntry
            // {
                // get
                // {
                    // if (m_SelectedEntry == null && SelectedTableCollection != null)
                    // {
                        // m_SelectedEntry = m_SelectedTableCollection.SharedData.GetEntryFromReference(tableEntryReference.Reference);
                    // }
                    // return m_SelectedEntry;
                // }
                // set
                // {
                    // m_FieldLabel = null;
                    // m_SelectedEntry = value;
                    // tableEntryReference.Reference = value != null ? value.Id : SharedTableData.EmptyId;
                // }
            // }

            public GUIContent FieldLabel
            {
                get
                {
                    if (m_FieldLabel == null)
                    {
                        var icon = EditorGUIUtility.ObjectContent(null, assetType);
                        // if (SelectedTableCollection != null && SelectedTableEntry != null)
                        // {
                            // var key = SelectedTableEntry.Key;
                            // var eol = key.IndexOf('\n');
                            // if (eol > 0)
                            // {
                                // We don't want a multiline label as it overflows in the UI.
                                // key = key.Substring(0, eol);
                            // }
                            // m_FieldLabel = new GUIContent($"{SelectedTableCollection.TableCollectionName}/{key}", icon.image);
                        // }
                        // else
                        // {
                            // m_FieldLabel = new GUIContent($"None ({assetType.Name})", icon.image);
                        // }
                    }
                    return m_FieldLabel;
                }
            }

            public virtual void Reset()
            {
                serializedObject = null;
                // tableReference = null;
                // tableEntryReference = null;

                // Clear cached values
                m_FieldLabel = null;
                // m_SelectedEntry = null;
                m_SelectedTableCollection = null;
                m_SelectedTableIdx = -1;

                NeedsInitializing = true;
            }

            public virtual void Init(SerializedProperty property)
            {
                serializedObject = property.serializedObject;
                // tableReference = new SerializedTableReference(property.FindPropertyRelative("m_TableReference"));
                // tableEntryReference = new SerializedTableEntryReference(property.FindPropertyRelative("m_TableEntryReference"));
                NeedsInitializing = false;
            }
        }

	    public override Data CreatePropertyData(SerializedProperty property) => new Data { entryNameLabel = Styles.EntryName };
	    public override void OnGUI(Data data, Rect position, SerializedProperty property, GUIContent label)
	    {
		    var rowPosition = new Rect(position.x, position.y, position.width, EditorGUIUtility.singleLineHeight);

		    var foldoutRect = new Rect(rowPosition.x, rowPosition.y, EditorGUIUtility.labelWidth, EditorGUIUtility.singleLineHeight);
		    var dropDownPosition = new Rect(foldoutRect.xMax, rowPosition.y, rowPosition.width - EditorGUIUtility.labelWidth, EditorGUIUtility.singleLineHeight);
		    rowPosition.y += rowPosition.height + EditorGUIUtility.standardVerticalSpacing;
		    property.isExpanded = EditorGUI.Foldout(foldoutRect, property.isExpanded, label, true);

		    if (EditorGUI.DropdownButton(dropDownPosition, data.FieldLabel, FocusType.Passive))
		    {
			    // var treeSelection = new TableEntryTreeView(data.assetType, (collection, entry) =>
			    // {
				    // data.SelectedTableCollection = collection as TCollection;
				    // data.SelectedTableEntry = entry;

				    // Will be called outside of OnGUI so we need to call ApplyModifiedProperties.
				    // data.serializedObject.ApplyModifiedProperties();
			    // });

			    // PopupWindow.Show(dropDownPosition, new TreeViewPopupWindow(treeSelection) { Width = dropDownPosition.width });
		    }

		    DrawTableDetails(position, rowPosition, data, property);
	    }
	    public override float GetPropertyHeight(Data data, SerializedProperty property, GUIContent label)
	    {
		    float height = EditorGUIUtility.singleLineHeight + EditorGUIUtility.standardVerticalSpacing; // Foldout field height
		    if (property.isExpanded)
		    {
			    height += EditorGUIUtility.singleLineHeight; // Selected table
			    height += EditorGUIUtility.singleLineHeight; // create table/add entry button
			    height += EditorGUIUtility.singleLineHeight + EditorGUIUtility.standardVerticalSpacing; // Add locale button

			    // if (data.SelectedTableEntry != null)
			    // {
				    // Entry name
				    // height += EditorStyles.textField.CalcHeight(new GUIContent(data.SelectedTableEntry?.Key), EditorGUIUtility.currentViewWidth) + EditorGUIUtility.standardVerticalSpacing;
			    // }
		    }
		    return height;
	    }

	    void DrawTableDetails(Rect position, Rect rowPosition, Data data, SerializedProperty property)
        {
            if (!property.isExpanded)
                return;

            EditorGUI.indentLevel++;

            // Table selection
            var tableSelectionPos = data.SelectedTableIndex != 0 ? new Rect(rowPosition.x, rowPosition.y, rowPosition.width - k_OpenTableEditorButtonWidth, rowPosition.height) : rowPosition;
            EditorGUI.BeginChangeCheck();
            var selectedTableIndex = EditorGUI.Popup(tableSelectionPos, Styles.SelectedTable, data.SelectedTableIndex, ProjectTableLabels);
            if (EditorGUI.EndChangeCheck())
            {
                data.SelectedTableIndex = selectedTableIndex;
            }

            if (data.SelectedTableIndex != 0)
            {
                var openTableEditorPos = new Rect(tableSelectionPos.xMax, tableSelectionPos.y, k_OpenTableEditorButtonWidth, tableSelectionPos.height);
                if (GUI.Button(openTableEditorPos, EditorIcons.StringTable))
                {
                    // LocalizationTablesWindow.ShowWindow(data.SelectedTableCollection);
                }
            }

            rowPosition.y += rowPosition.height;
            var buttonPos = new Rect(rowPosition.x + EditorGUIUtility.labelWidth, rowPosition.y, rowPosition.width - EditorGUIUtility.labelWidth, rowPosition.height);
            if (selectedTableIndex == 0)
            {
                if (GUI.Button(buttonPos, Styles.AddTableCollection, EditorStyles.miniButton))
                {
                    // LocalizationTablesWindow.ShowTableCreator();
                }
            }
            else
            {
                if (GUI.Button(buttonPos, Styles.AddTableEntry, EditorStyles.miniButton))
                {
                    // Attempt to create a new key with a set default name
                    // var keys = data.SelectedTableCollection.SharedData;

                    // Undo.RecordObject(keys, "Add entry.");
                    // var entry = keys.AddKey();
                    // EditorUtility.SetDirty(keys);

                    // data.SelectedTableEntry = entry;
                    // LocalizationEditorSettings.EditorEvents.RaiseTableEntryAdded(data.SelectedTableCollection, entry);
                }
            }

            rowPosition.y += rowPosition.height;
            buttonPos.y = rowPosition.y;
            if (GUI.Button(buttonPos, Styles.AddLocale))
            {
                // LocaleGeneratorWindow.ShowWindow();
            }
            rowPosition.y += rowPosition.height + EditorGUIUtility.standardVerticalSpacing;

            // if (data.SelectedTableEntry != null)
                // DrawTableEntryDetails(ref rowPosition, data, position);
            EditorGUI.indentLevel--;
        }

	    static GUIContent[] s_TableChoicesLabels;
	    static TCollection[] s_TableChoices;
	    const float k_OpenTableEditorButtonWidth = 30;

	    static GUIContent[] ProjectTableLabels
	    {
		    get
		    {
			    if (s_TableChoicesLabels == null)
			    {
				    var assetTables = GetProjectTableCollections();

				    s_TableChoices = new TCollection[assetTables.Count + 1];
				    assetTables.CopyTo(s_TableChoices, 1);

				    s_TableChoicesLabels = new GUIContent[assetTables.Count + 1];
				    s_TableChoicesLabels[0] = Styles.NoTableSelected;
				    for (int i = 0; i < assetTables.Count; ++i)
				    {
					    // s_TableChoicesLabels[i + 1] = new GUIContent(assetTables[i].TableCollectionName);
				    }
			    }
			    return s_TableChoicesLabels;
		    }
	    }

	    protected static Func<ReadOnlyCollection<TCollection>> GetProjectTableCollections { get; set; }

    }
}
