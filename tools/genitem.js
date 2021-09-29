import {default as ts} from 'byots';
import fs from 'node:fs/promises';

const s = await fs.readFile(new URL('../dist/index.d.ts', import.meta.url), { encoding: 'utf8' });

const src = ts.createSourceFile('index.d.ts', s, 99, true);

const types = {};
(function collectTypes(node, depth = 0) {
    if (node.kind === ts.SyntaxKind.TypeAliasDeclaration) {
        types[node.name.escapedText] = node;
    }
    node.getChildren().forEach(c=> collectTypes(c, depth));
})(src);

const stop = new Set([
    "typeidx",
    "funcidx",
    "tableidx",
    "memidx",
    "globalidx",
    "elemidx",
    "dataidx",
    "localidx",
    "labelidx",
]);
const targs = [];
const generics = [];
const result = (function process(target) {
    switch (target.kind) {
    case ts.SyntaxKind.TypeAliasDeclaration: {
        if (typeof target.typeParameters !== 'undefined') {
            const gen = Object.fromEntries(target.typeParameters.map((p, n) => {
                return [p.name.escapedText, targs.at(-1)[n]];
            }));

            generics.push(gen);
            try {
                return process(target.type);
            } finally {
                generics.pop();
            }
        } else {
            return process(target.type);
        }
    }

    case ts.SyntaxKind.IntersectionType: {
        return target.types.map(process).join(" & ");
    }

    case ts.SyntaxKind.UnionType: {
        return target.types.map(process).join(" | ");
    }

    case ts.SyntaxKind.TypeLiteral: {
        return "{ " + target.members.map(process).join(", ") + " }";
    }

    case ts.SyntaxKind.PropertySignature: {
        return target.name.escapedText + ": " + process(target.type);
    }

    case ts.SyntaxKind.TupleType: {
        return "[ " + target.elements.map(process).join(", ") + " ]";
    }

    case ts.SyntaxKind.StringKeyword: {
        return "string";
    }

    case ts.SyntaxKind.TypeReference: {
        const name = target.typeName.escapedText;
        if (stop.has(name)) {
            return name;
        }
        for (const gen of [...generics].reverse()) {
            if (name in gen) {
                targs.push(target.typeArguments ?? []);
                try {
                    return process(gen[name]);
                } finally {
                    targs.pop();
                }
            }
        }
        if (name in types) {
            targs.push(target.typeArguments ?? []);
            try {
                return process(types[name]);
            } finally {
                targs.pop();
            }
        } else {
            return name;
        }
    }

    case ts.SyntaxKind.MappedType: {
        const kname = target.typeParameter.name.escapedText;
        const kcons = process(target.typeParameter.constraint);
        const vty = process(target.type);
        return `{ [${kname} in ${kcons}]: ${vty} }`;
    }

    case ts.SyntaxKind.ArrayType: {
        return process(target.elementType) + "[]";
    }

    case ts.SyntaxKind.LiteralType: {
        return process(target.literal);
    }

    case ts.SyntaxKind.StringLiteral: {
        return JSON.stringify(target.text);
    }

    case ts.SyntaxKind.NullKeyword: {
        return "null";
    }

    case ts.SyntaxKind.NumberKeyword: {
        return "number";
    }

    case ts.SyntaxKind.UndefinedKeyword: {
        return "undefined";
    }

    case ts.SyntaxKind.NeverKeyword: {
        return "never";
    }

    default:
        console.log(s.slice(target.pos, target.end));
        throw new Error(`${target.kind}`);
    }
})(types['Item']);
console.log("declare type Item =", result, ";");

