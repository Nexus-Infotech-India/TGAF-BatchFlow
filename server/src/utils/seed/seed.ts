import { PrismaClient } from '../../../src/generated/prisma';
import { v4 as uuidv4 } from 'uuid';
import { ParameterDataType } from '../../../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed data creation for turmeric powder categories and parameters...');
  
  // Create units of measurement first
  const units = [
    {
      name: 'Percentage',
      symbol: '%',
      description: 'Percentage value'
    },
    {
      name: 'CFU per gram',
      symbol: 'cfu/g',
      description: 'Colony forming units per gram'
    },
    {
      name: 'CFU per 25 gram',
      symbol: 'cfu/25g',
      description: 'Colony forming units per 25 grams'
    },
    {
      name: 'Unitless',
      symbol: '-',
      description: 'Qualitative or descriptive parameter with no unit'
    }
  ];
  
  const createdUnits: { [key: string]: any } = {};
  
  for (const unit of units) {
    const createdUnit = await prisma.unitOfMeasurement.upsert({
      where: { name: unit.name },
      update: {},
      create: {
        id: uuidv4(),
        name: unit.name,
        symbol: unit.symbol,
        description: unit.description,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`Created unit: ${createdUnit.name} (${createdUnit.id})`);
    createdUnits[createdUnit.name] = createdUnit;
  }
  
  // Create the product
  const turmericPowder = await prisma.product.upsert({
    where: { name: 'Sterilized Turmeric powder' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Sterilized Turmeric powder',
      code: 'TURMERIC-001',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  console.log(`Created product: ${turmericPowder.name} (${turmericPowder.id})`);
  
  // Create the standard categories exactly from the COA
  const categories = [
    {
      name: 'Organoleptic',
      description: 'Sensory characteristics'
    },
    {
      name: 'Physical',
      description: 'Physical properties'
    },
    {
      name: 'Chemical',
      description: 'Chemical composition'
    }
  ];
  
  const createdCategories: { [key: string]: any } = {};
  
  for (const category of categories) {
    const createdCategory = await prisma.standardCategory.upsert({
      where: { name: category.name },
      update: {},
      create: {
        id: uuidv4(),
        name: category.name,
        description: category.description,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`Created standard category: ${createdCategory.name} (${createdCategory.id})`);
    createdCategories[createdCategory.name] = createdCategory;
    
    // Link category with product using ProductStandardCategory
    await prisma.productStandardCategory.upsert({
      where: {
        productId_categoryId: {
          productId: turmericPowder.id,
          categoryId: createdCategory.id
        }
      },
      update: {},
      create: {
        id: uuidv4(),
        productId: turmericPowder.id,
        categoryId: createdCategory.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`Linked category ${createdCategory.name} with product ${turmericPowder.name}`);
  }
  
  // Create parameters for each category with associated units based on the COA
  const parameters = [
    // Organoleptic parameters
    {
      name: 'Appearance',
      description: 'Visual appearance of the turmeric powder',
      categoryName: 'Organoleptic',
      dataType: 'TEXT',
      productType: 'TURMERIC',
      unitName: 'Unitless' // Visual test
    },
    {
      name: 'Texture',
      description: 'Texture characteristics of the turmeric powder',
      categoryName: 'Organoleptic',
      dataType: 'TEXT',
      productType: 'TURMERIC',
      unitName: 'Unitless' // Visual test
    },
    {
      name: 'Odour',
      description: 'Smell characteristics of the turmeric powder',
      categoryName: 'Organoleptic',
      dataType: 'TEXT',
      productType: 'TURMERIC',
      unitName: 'Unitless' // Sensory test
    },
    
    // Physical parameters
    {
      name: 'Particle size',
      description: 'Size of turmeric powder particles',
      categoryName: 'Physical',
      dataType: 'TEXT',
      productType: 'TURMERIC',
      unitName: 'Unitless' // Visual assessment
    },
    {
      name: 'Retention on 0.88mm',
      description: 'Retained particles on 0.88mm sieve',
      categoryName: 'Physical',
      dataType: 'FLOAT',
      productType: 'TURMERIC',
      unitName: 'Percentage' // % in COA
    },
    {
      name: 'Retention on 0.5mm(max)',
      description: 'Maximum retained particles on 0.5mm sieve',
      categoryName: 'Physical',
      dataType: 'FLOAT',
      productType: 'TURMERIC',
      unitName: 'Percentage' // % in COA
    },
    {
      name: 'Foreign matter',
      description: 'Foreign matter content in turmeric',
      categoryName: 'Physical',
      dataType: 'FLOAT',
      productType: 'TURMERIC',
      unitName: 'Unitless' // Visual inspection
    },
    
    // Chemical parameters
    {
      name: 'Moisture %Max',
      description: 'Maximum moisture percentage in turmeric',
      categoryName: 'Chemical',
      dataType: 'FLOAT',
      productType: 'TURMERIC',
      unitName: 'Percentage' // % in COA
    },
    {
      name: 'Water Activity',
      description: 'Water activity level in turmeric',
      categoryName: 'Chemical',
      dataType: 'FLOAT',
      productType: 'TURMERIC',
      unitName: 'Percentage' // % in COA
    },
    {
      name: 'Total Ash, Max',
      description: 'Maximum total ash content in turmeric',
      categoryName: 'Chemical',
      dataType: 'FLOAT',
      productType: 'TURMERIC',
      unitName: 'Percentage' // % in COA
    },
    {
      name: 'Insoluble Ash in Acid, max',
      description: 'Maximum acid-insoluble ash in turmeric',
      categoryName: 'Chemical',
      dataType: 'FLOAT',
      productType: 'TURMERIC',
      unitName: 'Percentage' // % in COA
    },
    {
      name: 'Curcumine',
      description: 'Curcumine content',
      categoryName: 'Chemical',
      dataType: 'FLOAT',
      productType: 'TURMERIC',
      unitName: 'Percentage' // % in COA
    },
    {
      name: 'Bacillus cereus',
      description: 'Bacillus cereus count in turmeric',
      categoryName: 'Chemical',
      dataType: 'INTEGER',
      productType: 'TURMERIC',
      unitName: 'CFU per gram' // cfu/g in COA
    },
    {
      name: 'Listeria Monocytogenes',
      description: 'Listeria monocytogenes count in turmeric',
      categoryName: 'Chemical',
      dataType: 'INTEGER',
      productType: 'TURMERIC',
      unitName: 'CFU per gram' // cfu/g in COA
    },
    {
      name: 'Clostridium perfringes',
      description: 'Clostridium perfringes count in turmeric',
      categoryName: 'Chemical',
      dataType: 'INTEGER',
      productType: 'TURMERIC',
      unitName: 'CFU per gram' // cfu/g in COA
    },
    {
      name: 'Salmonella/25g',
      description: 'Salmonella detection in 25g turmeric sample',
      categoryName: 'Chemical',
      dataType: 'INTEGER',
      productType: 'TURMERIC',
      unitName: 'CFU per 25 gram' // cfu/25g in COA
    },
    {
      name: 'Total Plate count',
      description: 'Total plate count in turmeric',
      categoryName: 'Chemical',
      dataType: 'INTEGER',
      productType: 'TURMERIC',
      unitName: 'CFU per gram' // cfu/g in COA
    },
    {
      name: 'E.coli',
      description: 'E. coli count in turmeric',
      categoryName: 'Chemical',
      dataType: 'INTEGER',
      productType: 'TURMERIC',
      unitName: 'CFU per gram' // cfu/g in COA
    },
    {
      name: 'Enterobacteriaceae',
      description: 'Enterobacteriaceae count in turmeric',
      categoryName: 'Chemical',
      dataType: 'INTEGER',
      productType: 'TURMERIC',
      unitName: 'CFU per gram' // cfu/g in COA
    },
    {
      name: 'Yeast/Moulds',
      description: 'Yeast and mold count in turmeric',
      categoryName: 'Chemical',
      dataType: 'INTEGER',
      productType: 'TURMERIC',
      unitName: 'CFU per gram' // cfu/g in COA
    }
  ];
  
  const createdParameters: any[] = [];
  
  for (const param of parameters) {
    // Find the category
    const category = createdCategories[param.categoryName];
    
    if (!category) {
      console.log(`Category not found for parameter: ${param.name}`);
      continue;
    }
    
    // Find the unit
    const unit = createdUnits[param.unitName];
    
    if (!unit) {
      console.log(`Unit not found for parameter: ${param.name}`);
      continue;
    }
    
    // Create the parameter with productType and unitId
   const parameterId = uuidv4();
const createdParam = await prisma.standardParameter.upsert({
  where: {
    name_categoryId_productType: {
      name: param.name,
      categoryId: category.id,
      productType: param.productType || '',
    }
  },
  update: {
    description: param.description,
    dataType: param.dataType as ParameterDataType,
    unitId: unit.id,
    updatedAt: new Date()
  },
  create: {
    id: parameterId,
    name: param.name,
    description: param.description,
    dataType: param.dataType as ParameterDataType,
    categoryId: category.id,
    productType: param.productType || '',
    unitId: unit.id,
    createdAt: new Date(),
    updatedAt: new Date()
  }
});

console.log(`Created/Updated parameter: ${createdParam.name} (${createdParam.productType}) with unit ${param.unitName}`);
createdParameters.push(createdParam);
    
    // Link parameter to turmeric powder product
    await prisma.productParameter.upsert({
  where: {
    productId_parameterId: {
      productId: turmericPowder.id,
      parameterId: createdParam.id,
    }
  },
  update: {
    isRequired: true,
    updatedAt: new Date()
  },
  create: {
    id: uuidv4(),
    productId: turmericPowder.id,
    parameterId: createdParam.id,
    isRequired: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
});
    
    console.log(`Linked parameter ${createdParam.name} to product ${turmericPowder.name}`);
  }
  
  console.log(`Created ${createdParameters.length} parameters for turmeric powder`);
  console.log('Turmeric powder seed data creation completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed data creation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });