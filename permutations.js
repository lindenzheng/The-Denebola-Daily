async function allWords(board) {
    try {
        const response = await fetch('2of12inf.txt');
        const data = await response.text();
        const dictionary = new Set(data.split(/\r?\n/).filter(Boolean));

        let allPermutations = new Set();

        for (let length = 4; length <= board.flat().length; length++) {
            const permutationsOfLength = generatePermutations(board, length);
            console.log(permutationsOfLength);
            permutationsOfLength.forEach(permutation => allPermutations.add(permutation));
        }
        
        const validWords = [...allPermutations].filter(word => dictionary.has(word));
        console.log(validWords);

        // check validWords use index?
    } catch (error) {
        console.error('Error:', error);
    }
}

function generatePermutations(board, length) {
    const allPermutations = new Set();
    const rows = board.length;
    const cols = board[0].length;

    function dfs(currentPermutation, row, col, visited) {
        if (
            currentPermutation !== null &&
            currentPermutation.length === length
        ) {
            allPermutations.add(currentPermutation);
            return;
        }

        const directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0], // right, down, left, up
            [1, 1], [1, -1], [-1, 1], [-1, -1] // diagonals: down-right, down-left, up-right, up-left
        ];

        for (let [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;

            // new cell is within bounds and not visited
            if (
                newRow >= 0 && newRow < rows &&
                newCol >= 0 && newCol < cols &&
                !visited.has(`${newRow},${newCol}`)
            ) {
                // mark new cell as visited and continue DFS
                visited.add(`${newRow},${newCol}`);
                dfs(currentPermutation + board[newRow][newCol], newRow, newCol, visited);
                visited.delete(`${newRow},${newCol}`); // backtrack
            }
        }
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const visited = new Set();
            visited.add(`${row},${col}`);
            dfs(board[row][col], row, col, visited);
        }
    }
    
    return allPermutations;
}

const words = allWords([
    ["d",null,"l"],
    ["e","p","o"],
    ["u","d","a"]
]);
