document.addEventListener('DOMContentLoaded', () => {
  const fileDisplayArea = document.getElementById('file-display-area');
  const backButton = document.getElementById('back-button');
  const breadcrumbsNav = document.getElementById('navigation-controls'); // Using the existing div for breadcrumbs

  // Main data store for all files and folders at the root
  let rootFiles = [
    { type: 'folder', name: 'Work Documents', files: [] },
    { type: 'folder', name: 'Personal Projects', files: [
        { type: 'file', name: 'ProjectPlan.pdf', path: '/mock/path/ProjectPlan.pdf' },
        { type: 'folder', name: 'SubProject A', files: [
            { type: 'file', name: 'SubProjectDetail.pdf', path: '/mock/path/SubProjectDetail.pdf' },
        ]}
    ]},
    { type: 'file', name: 'MyDocument1.pdf', path: '/mock/path/MyDocument1.pdf' },
    { type: 'file', name: 'MyDocument2.pdf', path: '/mock/path/MyDocument2.pdf' },
    { type: 'file', name: 'Holiday_Plans.pdf', path: '/mock/path/Holiday_Plans.pdf' },
    { type: 'folder', name: 'Archives', files: [] },
    { type: 'file', name: 'Old_Report.pdf', path: '/mock/path/Old_Report.pdf' },
  ];

  // Navigation state: stack of folder objects being viewed.
  // Each element: { name: 'FolderName', items: array_of_files_and_folders_in_it }
  let currentPath = [{ name: 'Root', items: rootFiles }];

  function getCurrentViewItems() {
    return currentPath[currentPath.length - 1].items;
  }

  function renderBreadcrumbs() {
    breadcrumbsNav.innerHTML = ''; // Clear previous breadcrumbs or back button
    
    if (currentPath.length > 1) { // Not in Root
        const backBtn = document.createElement('button');
        backBtn.id = 'back-button'; // For styling
        backBtn.textContent = 'Back';
        backBtn.addEventListener('click', () => {
            currentPath.pop();
            renderFiles();
            renderBreadcrumbs();
        });
        breadcrumbsNav.appendChild(backBtn);
    }

    // Add breadcrumb spans
    currentPath.forEach((level, index) => {
        const levelSpan = document.createElement('span');
        levelSpan.textContent = level.name;
        if (index < currentPath.length - 1) { // Not the last item
            levelSpan.classList.add('breadcrumb-link');
            levelSpan.addEventListener('click', () => {
                currentPath = currentPath.slice(0, index + 1);
                renderFiles();
                renderBreadcrumbs();
            });
        } else {
            levelSpan.classList.add('current-folder');
        }
        
        breadcrumbsNav.appendChild(levelSpan);
        if (index < currentPath.length - 1) {
            const separator = document.createElement('span');
            separator.textContent = ' > ';
            breadcrumbsNav.appendChild(separator);
        }
    });
  }


  function createFileElement(item) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add(item.type === 'file' ? 'file-item' : 'folder-item');
    itemDiv.dataset.itemName = item.name; 

    const iconSpan = document.createElement('span');
    iconSpan.classList.add('icon');
    iconSpan.textContent = item.type === 'file' ? '📄' : '📁';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.name;

    itemDiv.appendChild(iconSpan);
    itemDiv.appendChild(nameSpan);

    if (item.type === 'file') {
      itemDiv.draggable = true;
      itemDiv.dataset.filePath = item.path;

      itemDiv.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', item.path);
        event.dataTransfer.setData('source-type', 'internal-file-move');
        event.stopPropagation(); // Prevent main area drag listener
      });

      itemDiv.addEventListener('click', () => {
        if (window.electronAPI && typeof window.electronAPI.openPdfWindow === 'function') {
          window.electronAPI.openPdfWindow(item.path);
        } else {
          console.error('electronAPI.openPdfWindow is not available.');
        }
      });
    } else if (item.type === 'folder') {
      itemDiv.addEventListener('click', () => {
        if (!item.files) item.files = []; // Ensure folder has a files array
        currentPath.push({ name: item.name, items: item.files });
        renderFiles();
        renderBreadcrumbs();
      });

      itemDiv.addEventListener('dragover', (event) => {
        if (event.dataTransfer.types.includes('source-type') && event.dataTransfer.getData('source-type') === 'internal-file-move') {
          event.preventDefault();
          itemDiv.classList.add('folder-drop-target');
          event.stopPropagation();
        }
      });

      itemDiv.addEventListener('dragenter', (event) => {
        if (event.dataTransfer.types.includes('source-type') && event.dataTransfer.getData('source-type') === 'internal-file-move') {
          event.preventDefault();
          itemDiv.classList.add('folder-drop-target');
          event.stopPropagation();
        }
      });

      itemDiv.addEventListener('dragleave', (event) => {
        if (!itemDiv.contains(event.relatedTarget)) {
            itemDiv.classList.remove('folder-drop-target');
        }
        event.stopPropagation();
      });

      itemDiv.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation(); // Important to stop event from bubbling to parent fileDisplayArea
        itemDiv.classList.remove('folder-drop-target');

        const draggedFileIdentifier = event.dataTransfer.getData('text/plain');
        const sourceType = event.dataTransfer.getData('source-type');

        if (sourceType !== 'internal-file-move' || !draggedFileIdentifier) {
          return;
        }
        
        // Find the source of the dragged file
        let sourceArray = null;
        let draggedFileIndex = -1;
        let draggedFileObject = null;

        // Check rootFiles first
        draggedFileIndex = rootFiles.findIndex(file => file.path === draggedFileIdentifier);
        if (draggedFileIndex > -1) {
            sourceArray = rootFiles;
            draggedFileObject = rootFiles[draggedFileIndex];
        } else {
            // Check within folders (this part needs to be more robust if files can be deeply nested and moved from anywhere)
            // For now, this simple example assumes files are moved from the root or the immediate parent shown in breadcrumbs
            // A more robust solution would search through the entire tree or pass source context.
            // For this iteration, we assume files are dragged from the currently displayed list or root for simplicity.
            const parentView = currentPath.length > 1 ? currentPath[currentPath.length - 2].items : rootFiles;
            draggedFileIndex = parentView.findIndex(file => file.path === draggedFileIdentifier);
             if (draggedFileIndex > -1) {
                sourceArray = parentView;
                draggedFileObject = parentView[draggedFileIndex];
            }
        }
        
        // Find target folder (which is 'item' itself)
        const targetFolderObject = item; 
        
        if (draggedFileObject && targetFolderObject && draggedFileObject !== targetFolderObject) {
          if (!targetFolderObject.files) {
            targetFolderObject.files = [];
          }
          targetFolderObject.files.push(draggedFileObject);

          if (sourceArray && draggedFileIndex > -1) {
            sourceArray.splice(draggedFileIndex, 1);
          }
          
          console.log(`Moved '${draggedFileObject.name}' into folder '${targetFolderObject.name}'`);
          renderFiles(); 
          renderBreadcrumbs();
        } else {
          console.log('Failed to move file: Dragged file or target folder not found, or invalid operation.');
        }
      });
    }
    return itemDiv;
  }

  function renderFiles() {
    fileDisplayArea.innerHTML = '';
    const itemsToDisplay = getCurrentViewItems();

    if (itemsToDisplay.length === 0) {
      fileDisplayArea.innerHTML = '<p>This folder is empty. Drag and drop PDF files here or use the "Add PDF(s)" button.</p>';
    } else {
      itemsToDisplay.forEach((item) => {
        const itemElement = createFileElement(item);
        fileDisplayArea.appendChild(itemElement);
      });
    }
  }

  // Main fileDisplayArea drag-drop for adding EXTERNAL files
  fileDisplayArea.addEventListener('dragover', (event) => {
    if (!event.dataTransfer.types.includes('source-type')) {
        event.preventDefault(); 
        fileDisplayArea.classList.add('drop-target-active');
    }
  });
  fileDisplayArea.addEventListener('dragenter', (event) => {
     if (!event.dataTransfer.types.includes('source-type')) {
        event.preventDefault();
        fileDisplayArea.classList.add('drop-target-active');
    }
  });
  fileDisplayArea.addEventListener('dragleave', (event) => {
    if (!fileDisplayArea.contains(event.relatedTarget) || !event.dataTransfer.types.includes('source-type')) {
      fileDisplayArea.classList.remove('drop-target-active');
    }
  });
  fileDisplayArea.addEventListener('drop', (event) => {
    if (event.dataTransfer.types.includes('source-type')) {
        return; // Handled by individual folder items
    }
    event.preventDefault();
    fileDisplayArea.classList.remove('drop-target-active');

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const currentFolderItems = getCurrentViewItems();
      // Clear mock data ONLY if it's present in the current view
      const mockFileInCurrentView = currentFolderItems.find(f => f.path && f.path.startsWith('/mock/path'));
      if (mockFileInCurrentView) {
          // Filter out mock files from the current view
          currentPath[currentPath.length-1].items = currentFolderItems.filter(f => !(f.path && f.path.startsWith('/mock/path')));
      }
      
      for (const file of files) {
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          const newFile = { type: 'file', name: file.name, path: file.path };
          getCurrentViewItems().push(newFile);
        } else {
          console.log('Non-PDF file dropped and ignored:', file.name);
        }
      }
      renderFiles();
      renderBreadcrumbs();
    }
  });

  // Initial Render
  renderFiles();
  renderBreadcrumbs();

  // Button click for File Dialog
  const addPdfButton = document.getElementById('add-pdf-button');
  if (addPdfButton) {
    addPdfButton.addEventListener('click', async () => {
      const filePaths = await window.electronAPI.openFileDialog();
      if (filePaths && filePaths.length > 0) {
        const currentFolderItems = getCurrentViewItems();
        const mockFileInCurrentView = currentFolderItems.find(f => f.path && f.path.startsWith('/mock/path'));
        if (mockFileInCurrentView) {
             currentPath[currentPath.length-1].items = currentFolderItems.filter(f => !(f.path && f.path.startsWith('/mock/path')));
        }
        
        filePaths.forEach(filePath => {
          const fileName = filePath.split(/[\\\/]/).pop();
          const newFile = { type: 'file', name: fileName, path: filePath };
          getCurrentViewItems().push(newFile);
        });
        renderFiles();
        renderBreadcrumbs();
      }
    });
  }

  // Button click for Create Folder
  const createFolderButton = document.getElementById('create-folder-button');
  if (createFolderButton) {
    createFolderButton.addEventListener('click', () => {
      const folderName = prompt("Enter folder name:");
      if (folderName && folderName.trim() !== "") {
        const currentFolderItems = getCurrentViewItems();
        const isDuplicate = currentFolderItems.some(item => item.type === 'folder' && item.name === folderName.trim());
        if (isDuplicate) {
          alert("A folder with this name already exists in the current view. Please choose a different name.");
          return;
        }
        const newFolder = { type: 'folder', name: folderName.trim(), files: [] };
        currentFolderItems.push(newFolder);
        
        const mockFileInCurrentView = currentFolderItems.find(f => f.path && f.path.startsWith('/mock/path'));
        if (mockFileInCurrentView) {
            currentPath[currentPath.length-1].items = currentFolderItems.filter(f => !(f.path && f.path.startsWith('/mock/path')));
            if (!currentFolderItems.find(f => f.type === 'folder' && f.name === newFolder.name)) {
                 currentFolderItems.push(newFolder);
             }
        }
        renderFiles();
        renderBreadcrumbs();
      } else if (folderName !== null) {
        alert("Folder name cannot be empty.");
      }
    });
  }
});
