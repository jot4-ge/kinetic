# Status de Refeição é binário (Seguiu / Não Seguiu), sem estado intermediário

O modelo de registro de Refeição tem dois estados: Seguiu ou Não Seguiu. Consideramos um terceiro estado ("Seguiu Parcialmente"), mas o rejeitamos porque sem critério objetivo ele vira lixo de dados — qualquer desvio tenderia a ser classificado como "parcial" e o sinal de Aderência perderia valor. Desvios específicos são capturados pelos campos opcionais de macros reais, que sobrescrevem os valores da Opção para aquele dia quando o usuário quiser ser preciso.
