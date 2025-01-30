const getRowBoundaryHeights = (lineItemsContainer, targetRowIndex) => {
    const heightsAboveTargetRow = [];
    const heightsBelowTargetRow = [];

    Array.from(lineItemsContainer.children).forEach((lineItem, index) => {
        const rect = lineItem.getBoundingClientRect();
        const scrollOffset = window.scrollY;

        if (index + 1 < targetRowIndex) {
            heightsAboveTargetRow.push(rect.bottom + scrollOffset);
        } else if (index + 1 > targetRowIndex) {
            heightsBelowTargetRow.push(rect.top + scrollOffset);
        }
    });

    return { heightsAboveTargetRow, heightsBelowTargetRow };
};

const createMouseMoveHandler = (lineItemsContainer, heightsAboveTargetRow, heightsBelowTargetRow, nthColumn) => {
    return (e) => {
        const mouseYPos = e.clientY + window.scrollY;

        heightsAboveTargetRow.forEach((aboveRowHeight, i) => {
            const lineItems = lineItemsContainer.children[i];
            const cell = lineItems.querySelector(`tr td:nth-child(${nthColumn}) div`);
            if (cell) {
                cell.classList.toggle("de-highlighted-cell", mouseYPos < aboveRowHeight);
            }
        });

        heightsBelowTargetRow.forEach((belowRowHeight, i) => {
            const lineItems = lineItemsContainer.children[heightsAboveTargetRow.length + 1 + i];
            const cell = lineItems.querySelector(`tr td:nth-child(${nthColumn}) div`);
            if (cell) {
                cell.classList.toggle("de-highlighted-cell", mouseYPos > belowRowHeight);
            }
        });
    };
};

const getTargetElement = (eventTarget) => {
    if (eventTarget.classList.contains("x-grid3-cell-inner")) {
        return eventTarget;
    }
    if (eventTarget.classList.contains("x-grid3-cell")) {
        return eventTarget.firstElementChild;
    }
    if (eventTarget.classList.contains("invoiceDescription")) {
        return eventTarget.parentElement;
    }
    return null;
};

const calculateRowAndColumn = (target) => {
    const nthColumn = target.parentElement.cellIndex + 1;
    const row = target.closest("div.x-grid3-row");
    if (!row) return null;

    const nthRow = Array.from(row.parentElement.children).indexOf(row) + 1;
    return { nthRow, nthColumn };
};

const preventDefault = (event) => event.preventDefault();


const cleanupMouseMove = (lineItemsContainer, mouseMoveHandler, target) => {
    lineItemsContainer.removeEventListener("mousemove", mouseMoveHandler);
    document.body.classList.remove("no-select");
    target.classList.remove("de-selected-cell");
};

const getSelectedTextFromDropdown = (focusEvent) => {
    const focusValue = focusEvent.target.value;
    const allSelected = document.querySelectorAll(".x-combo-selected");
    let selectedText = allSelected.length === 0 ? focusValue : "";

    allSelected.forEach((selected) => {
        const selectedChild = selected.firstElementChild;
        if (selectedChild && selectedText === "") {
            selected.classList.remove("x-combo-selected");
            selectedText = selectedChild.innerHTML;
        } else if (selectedText === "") {
            selectedText = selected.innerHTML;
        }
    });

    return selectedText;
};


const clearHighlightAndCleanUp = (lineItemsContainer, nthColumn, dropdownButton) => {
    for (const lineItem of lineItemsContainer.children) {
        const cell = lineItem.querySelector(`table tbody tr td:nth-child(${nthColumn}) div`);
        if (cell) {
            cell.classList.remove("de-highlighted-cell");
        }
    }
    if (dropdownButton) {
        dropdownButton.removeEventListener("mousedown", preventDefault);
    }
};

const blurHandler = (focusEvent, lineItemsContainer, target, state, nthColumn, dropdownButton, inputHandler) => { 
    const selectedText = getSelectedTextFromDropdown(focusEvent);

    const focusListener = (ef) => {
        if (ef.target.classList.contains("x-form-text") || ef.target.classList.contains("x-form-textarea")) {

            document.removeEventListener('focus', focusListener, true);

            if (ef.target.classList.contains("x-form-num-field")) {
                ef.target.value = state.input !== "&nbsp;" ? state.input : "";
            } else {
                ef.target.value = state.input === "" ? "" : selectedText;
            }
            document.querySelector(".x-grid3-cell-inner").click();
        }
        ef.target.blur();
        setTimeout(() => { ef.target.blur(); document.body.click() } , 100);
    }

    const highlightedCells = lineItemsContainer.querySelectorAll("div.de-highlighted-cell");

    if (highlightedCells.length !== 0) {
        document.addEventListener('focus', focusListener, true);
        target.click();
    }

    highlightedCells.forEach((highlightedCell) => {
        document.addEventListener('focus', focusListener, true);

        if (target.innerHTML === "&nbsp;" && state.input !== "&nbsp;") {
            highlightedCell.innerText = "";
        } else if (state.input !== "&nbsp;") {
            highlightedCell.innerText = target.innerHTML;            
        }
        highlightedCell.click();
    })

    clearHighlightAndCleanUp(lineItemsContainer, nthColumn, dropdownButton);

    focusEvent.target.removeEventListener('input', inputHandler);
}


const createInputHandler = (state, lineItemsContainer) => {
    return (event) => {
        const highlightedCells = lineItemsContainer.querySelectorAll("div.de-highlighted-cell");
        highlightedCells.forEach((highlightedCell) => {
            highlightedCell.innerText = event.target.value;
        });
        state.input = event.target.value; 
    };
}


const focusListener = (focusEvent) => {
    const dropdownButton = focusEvent.target.nextElementSibling;
    const preventDefault = (e) => {
        e.preventDefault(); 
    }

    if (dropdownButton) {
        dropdownButton.addEventListener("mousedown", preventDefault);
    }

    const state = { input: "&nbsp;" };
    const inputHandler = createInputHandler(state, lineItemsContainer);

    focusEvent.target.addEventListener('blur', () => {
        blurHandler(focusEvent, lineItemsContainer, target, state, nthColumn, dropdownButton, inputHandler);
    }, { once: true });

    focusEvent.target.addEventListener('input', inputHandler);

    document.removeEventListener('focus', focusListener, true); 
};

const handleMouseUp = (lineItemsContainer, mouseMoveHandler, target, nthColumn) => {
    cleanupMouseMove(lineItemsContainer, mouseMoveHandler, target);

    const focusListener = (focusEvent) => {
        const dropdownButton = focusEvent.target.nextElementSibling;
        const preventDefault = (e) => {
            e.preventDefault(); 
        }

        if (dropdownButton) {
            dropdownButton.addEventListener("mousedown", preventDefault);
        }

        const state = { input: "&nbsp;" };
        const inputHandler = createInputHandler(state, lineItemsContainer);

        focusEvent.target.addEventListener('blur', () => {
            blurHandler(focusEvent, lineItemsContainer, target, state, nthColumn, dropdownButton, inputHandler);
        }, { once: true });

        focusEvent.target.addEventListener('input', inputHandler);

        document.removeEventListener('focus', focusListener, true); 
    };

    document.addEventListener('focus', focusListener, true);
    target.click();
}

const handleLineItemMouseDown = (lineItemsContainer) => (event) => {
    const target = getTargetElement(event.target);
    if (!target) return;

    event.preventDefault();
    document.body.classList.add("no-select");

    const rowAndColumn = calculateRowAndColumn(target);
    if (!rowAndColumn) return;

    const { nthRow, nthColumn } = rowAndColumn;

    target.classList.add("de-selected-cell");

    const { heightsAboveTargetRow, heightsBelowTargetRow } = getRowBoundaryHeights(lineItemsContainer, nthRow);
    const mouseMoveHandler = createMouseMoveHandler(lineItemsContainer, heightsAboveTargetRow, heightsBelowTargetRow, nthColumn);

    lineItemsContainer.addEventListener("mousemove", mouseMoveHandler);

    
    window.addEventListener('mouseup', () => { 
        handleMouseUp(lineItemsContainer, mouseMoveHandler, target, nthColumn); 
    }, { once: true });
};

const main = () => {
    const lineItemsContainer = document.querySelector(".x-grid3-body");
    lineItemsContainer.addEventListener("mousedown", handleLineItemMouseDown(lineItemsContainer));
};

document.addEventListener("DOMContentLoaded", main);