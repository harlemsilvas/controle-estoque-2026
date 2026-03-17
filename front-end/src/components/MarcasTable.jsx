import PropTypes from "prop-types";

const MarcasTable = ({ marcas, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <table className="min-w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Código
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Descrição
          </th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
            Ações
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {marcas.length === 0 ? (
          <tr>
            <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
              Nenhuma marca encontrada
            </td>
          </tr>
        ) : (
          marcas.map((marca) => (
            <tr key={marca.CODIGO}>
              <td className="px-6 py-4">{marca.CODIGO}</td>
              <td className="px-6 py-4">{marca.DESCRICAO}</td>
              <td className="px-6 py-4 text-right space-x-2">
                <button
                  onClick={() => onEdit(marca)}
                  className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Editar marca ${marca.DESCRICAO}`}
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(marca.CODIGO)}
                  className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={`Excluir marca ${marca.DESCRICAO}`}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

MarcasTable.propTypes = {
  marcas: PropTypes.array.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default MarcasTable;

// const MarcasTable = ({ marcas, onEdit, onDelete }) => (
//   <div className="bg-white rounded-lg shadow overflow-hidden">
//     <table className="min-w-full">
//       <thead className="bg-gray-50">
//         <tr>
//           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//             Código
//           </th>
//           <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
//             Descrição
//           </th>
//           <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
//             Ações
//           </th>
//         </tr>
//       </thead>
//       <tbody className="divide-y divide-gray-200">
//         {marcas.map((marca) => (
//           <tr key={marca.CODIGO}>
//             <td className="px-6 py-4">{marca.CODIGO}</td>
//             <td className="px-6 py-4">{marca.DESCRICAO}</td>
//             <td className="px-6 py-4 text-right space-x-2">
//               <button
//                 onClick={() => onEdit(marca)}
//                 className="text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 aria-label={`Editar marca ${marca.DESCRICAO}`}
//               >
//                 Editar
//               </button>
//               <button
//                 onClick={() => onDelete(marca.CODIGO)}
//                 className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500"
//                 aria-label={`Excluir marca ${marca.DESCRICAO}`}
//               >
//                 Excluir
//               </button>
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   </div>
// );

// MarcasTable.propTypes = {
//   marcas: PropTypes.array.isRequired,
//   onEdit: PropTypes.func.isRequired,
//   onDelete: PropTypes.func.isRequired,
// };

// export default MarcasTable;
