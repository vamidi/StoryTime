using System.Collections.Generic;
using UnityEngine.UIElements;

using DatabaseSync.Binary;
using DatabaseSync.Database;
using UnityEngine;

namespace DatabaseSync.UI
{
	class ListViewTables : VisualElement
	{
		private readonly ScrollView m_LocalesList;

		// private readonly List<Button> m_Buttons = new List<Button>();

		internal new class UxmlFactory : UxmlFactory<ListViewTables> { }
		public ListViewTables()
		{
			var styles = Resources.GetStyleAsset(nameof(ListViewTables));
			styleSheets.Add(styles);

			var asset = Resources.GetTemplateAsset(nameof(ListViewTables));
			asset.CloneTree(this);

			// Tables
			List<Table> tables = TableDatabase.Get.GetTables();
			foreach (var table in tables)
			{
				AddTableElement(table);
			}

			// var locales = LocalizationEditorSettings.GetLocales();
			// m_LocalesList = this.Q<ScrollView>("locales-list");
			// foreach (var locale in locales)
			// {
				// AddLocaleElement(locale);
			// }

			// LocalizationEditorSettings.EditorEvents.LocaleAdded += OnLocaleAdded;
			// LocalizationEditorSettings.EditorEvents.LocaleRemoved += OnLocaleRemoved;
		}

		/*
		~ListViewTables()
		{
			LocalizationEditorSettings.EditorEvents.LocaleAdded -= OnLocaleAdded;
			LocalizationEditorSettings.EditorEvents.LocaleRemoved -= OnLocaleRemoved;
		}

		public List<Locale> GetSelectedLocales()
		{
			var locales = LocalizationEditorSettings.GetLocales();
			var selectedLocales = new List<Locale>();

			for (int i = 0; i < m_LocalesList.contentContainer.childCount; ++i)
			{
				if (m_LocalesList.contentContainer.ElementAt(i) is Toggle toggle && toggle.value)
				{
					Debug.Assert(locales[i].name == toggle.text, $"Expected locale to match toggle. Expected {locales[i].name} but got {toggle.name}");
					selectedLocales.Add(locales[i]);
				}
			}

			return selectedLocales;
		}

		void OnLocaleAdded(Locale locale)
		{
			AddLocaleElement(locale);
			UpdateCreateButtonState();
		}

		void OnLocaleRemoved(Locale locale)
		{
			var toggle = m_LocalesList.Q<Toggle>(locale.name);
			if (toggle != null)
			{
				m_LocalesList.Remove(toggle);
				UpdateCreateButtonState();
			}
		}

		void AddLocaleElement(Locale locale)
		{
			if (locale is PseudoLocale) // Don't include pseudo locales
				return;

			var toggle = new Toggle() { name = locale.name, text = locale.name, value = true };
			toggle.RegisterValueChangedCallback((evt) => UpdateCreateButtonState());
			m_LocalesList.Add(toggle);
		}
		*/

		/*
		void UpdateCreateButtonState()
		{
			// If we have no active Locales then the buttons should be disabled.
			foreach (var child in m_LocalesList.Children())
			{
				if (child is Toggle toggle)
				{
					if (toggle.value)
					{
						foreach (var visualElement in m_Buttons)
						{
							visualElement.SetEnabled(true);
						}

						// m_CreateStringTablesButton.SetEnabled(true);
						// m_CreateAssetTablesButton.SetEnabled(true);
						return;
					}
				}
			}

			foreach (var visualElement in m_Buttons)
			{
				visualElement.SetEnabled(false);
			}
		}
		*/

		void AddTableElement(Table table)
		{
			var el = this.Q("table-container");
			// Debug.Log(el);
			el.Add(new ListViewTableRow(table));
		}
	}
}
